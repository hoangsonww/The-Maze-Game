pipeline {
    agent any

    environment {
        NODE_VERSION = '16'
        DOCKER_IMAGE = 'maze-game'
        DOCKER_TAG = "${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
        DOCKER_REGISTRY = 'docker.io' // Change to your registry
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        POSTGRES_CREDENTIALS_ID = 'postgres-credentials'
        SENTRY_DSN = credentials('sentry-dsn')
    }

    tools {
        nodejs "NodeJS ${NODE_VERSION}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Checking out code...'
                checkout scm
                sh 'git rev-parse --short HEAD > .git/commit-id'
                script {
                    env.GIT_COMMIT_SHORT = readFile('.git/commit-id').trim()
                }
            }
        }

        stage('Environment Setup') {
            steps {
                echo '⚙️ Setting up environment...'
                sh 'node --version'
                sh 'npm --version'
                sh 'cp .env.example .env'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                echo '🔍 Running linter...'
                sh 'npm run lint || true' // Continue on linting errors
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        echo '🧪 Running unit tests...'
                        sh 'npm test -- --coverage --testPathPattern="__tests__/client"'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        echo '🧪 Running integration tests...'
                        sh 'npm test -- --coverage --testPathPattern="__tests__/server"'
                    }
                }
            }
            post {
                always {
                    // Publish test results
                    junit 'coverage/junit.xml'
                    // Publish coverage report
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Code Coverage Report'
                    ])
                }
            }
        }

        stage('Security Audit') {
            steps {
                echo '🔒 Running security audit...'
                sh 'npm audit --audit-level=moderate || true'
            }
        }

        stage('Build') {
            steps {
                echo '🏗️ Building application...'
                sh 'npm run build'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
                }
            }
        }

        stage('Docker Build') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    branch pattern: 'release/.*', comparator: 'REGEXP'
                }
            }
            steps {
                echo '🐳 Building Docker image...'
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.build("${DOCKER_IMAGE}:latest")
                }
            }
        }

        stage('Docker Push') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo '📤 Pushing Docker image...'
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS_ID}") {
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push()
                        if (env.BRANCH_NAME == 'main') {
                            docker.image("${DOCKER_IMAGE}:latest").push()
                            docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push('production')
                        }
                    }
                }
            }
        }

        stage('Deploy to Development') {
            when {
                branch 'develop'
            }
            steps {
                echo '🚀 Deploying to development environment...'
                script {
                    // SSH deployment to dev server
                    sshagent(['dev-server-ssh']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no user@dev-server.com '
                                cd /opt/maze-game &&
                                docker-compose pull &&
                                docker-compose up -d &&
                                docker-compose logs -f --tail=100
                            '
                        """
                    }
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                echo '🚀 Deploying to staging environment...'
                script {
                    sshagent(['staging-server-ssh']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no user@staging-server.com '
                                cd /opt/maze-game &&
                                docker-compose pull &&
                                docker-compose up -d &&
                                docker-compose logs -f --tail=100
                            '
                        """
                    }
                }
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    input message: 'Deploy to Production?', ok: 'Deploy'
                }
                echo '🚀 Deploying to production environment...'
                script {
                    sshagent(['prod-server-ssh']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no user@prod-server.com '
                                cd /opt/maze-game &&
                                docker-compose pull &&
                                docker-compose up -d --no-deps app &&
                                sleep 10 &&
                                curl -f http://localhost:3000/api/health || exit 1
                            '
                        """
                    }
                }
            }
        }

        stage('Database Migrations') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo '🗄️ Running database migrations...'
                script {
                    withCredentials([
                        usernamePassword(
                            credentialsId: "${POSTGRES_CREDENTIALS_ID}",
                            usernameVariable: 'DB_USER',
                            passwordVariable: 'DB_PASSWORD'
                        )
                    ]) {
                        sh """
                            PGPASSWORD=${DB_PASSWORD} psql -h db-server.com -U ${DB_USER} -d maze_game -f server/database/schema.sql || true
                        """
                    }
                }
            }
        }

        stage('Smoke Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo '🔥 Running smoke tests...'
                script {
                    def serverUrl = env.BRANCH_NAME == 'main' ? 'https://mazegame.com' : 'https://dev.mazegame.com'
                    sh """
                        curl -f ${serverUrl}/api/health || exit 1
                        curl -f ${serverUrl}/api/v1/leaderboard || exit 1
                    """
                }
            }
        }

        stage('Performance Tests') {
            when {
                branch 'main'
            }
            steps {
                echo '⚡ Running performance tests...'
                sh '''
                    # Install Apache Bench if needed
                    which ab || sudo apt-get install -y apache2-utils

                    # Run load test
                    ab -n 1000 -c 10 http://staging-server.com/api/health > performance.txt
                    cat performance.txt
                '''
            }
        }

        stage('Cleanup') {
            steps {
                echo '🧹 Cleaning up...'
                sh 'docker system prune -f'
                cleanWs()
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
            script {
                if (env.BRANCH_NAME == 'main') {
                    // Notify on Slack
                    slackSend(
                        color: 'good',
                        message: "✅ Maze Game deployed to production successfully!\nBuild: ${env.BUILD_NUMBER}\nCommit: ${env.GIT_COMMIT_SHORT}",
                        channel: '#deployments'
                    )
                }
            }
        }
        failure {
            echo '❌ Pipeline failed!'
            script {
                // Notify on Slack
                slackSend(
                    color: 'danger',
                    message: "❌ Maze Game build failed!\nBuild: ${env.BUILD_NUMBER}\nBranch: ${env.BRANCH_NAME}",
                    channel: '#alerts'
                )
            }
        }
        always {
            echo '📊 Publishing build artifacts...'
            // Archive logs
            archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
        }
    }
}
