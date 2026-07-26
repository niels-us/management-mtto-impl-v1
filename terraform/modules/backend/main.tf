data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ── Security Group ──────────────────────────────

resource "aws_security_group" "rds" {
  name        = "maintenance-api-rds-${lower(var.stage)}"
  description = "Allow inbound PostgreSQL for maintenance-api ${var.stage}"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ── RDS PostgreSQL ──────────────────────────────

resource "aws_db_subnet_group" "default" {
  name       = "maintenance-api-${lower(var.stage)}-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  description = "Default subnet group for maintenance-api ${var.stage} RDS"
}

resource "aws_db_instance" "postgres" {
  identifier        = "maintenance-api-${lower(var.stage)}"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = true

  multi_az = false

  backup_retention_period = 0
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  auto_minor_version_upgrade = true

  ca_cert_identifier = "rds-ca-rsa2048-g1"
}

# ── S3 (Serverless deployment artifacts) ─────────

resource "aws_s3_bucket" "deployment" {
  bucket        = "ue1ct${lower(var.stage)}stgmaintenanceapi001"
  force_destroy = true

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "deployment" {
  bucket = aws_s3_bucket.deployment.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "deployment" {
  bucket = aws_s3_bucket.deployment.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "deployment" {
  bucket = aws_s3_bucket.deployment.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ── IAM ─────────────────────────────────────────

resource "aws_iam_role" "lambda_exec" {
  name = "UE1CT${upper(var.stage)}SEGIAMROLEMAINTENANCEAPI001"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_exec_policy" {
  name = "UE1CT${upper(var.stage)}SEGIAMPOLICYMAINTENANCEAPI001"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/lambda/*"
      },
      {
        Sid    = "XRayTracing"
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Sid    = "SSMParameterStore"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.region}:${var.account_id}:parameter/MAINTENANCE-API/${var.stage}/*"
      }
    ]
  })
}

# ── SSM Parameters ─────────────────────────────

locals {
  ssm_root = "/MAINTENANCE-API/${var.stage}"

  postgresql_credentials = jsonencode({
    host                   = aws_db_instance.postgres.address
    port                   = 5432
    database               = var.db_name
    user                   = var.db_username
    password               = var.db_password
    ssl                    = { rejectUnauthorized = false }
    max                    = 5
    idleTimeoutMillis      = 30000
    connectionTimeoutMillis = 2000
  })
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "${local.ssm_root}/JWT_SECRET"
  description = "JWT signing secret for maintenance-api ${var.stage}"
  type        = "String"
  value       = var.jwt_secret

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "postgresql_credentials" {
  name        = "${local.ssm_root}/POSTGRESQL_CREDENTIALS"
  description = "PostgreSQL connection credentials for maintenance-api ${var.stage}"
  type        = "String"
  value       = local.postgresql_credentials

  depends_on = [aws_db_instance.postgres]
}

resource "aws_ssm_parameter" "groq_api_key" {
  name        = "${local.ssm_root}/GROQ_API_KEY"
  description = "Groq LLM API key for maintenance-api ${var.stage}"
  type        = "String"
  value       = var.groq_api_key

  lifecycle {
    ignore_changes = [value]
  }
}
