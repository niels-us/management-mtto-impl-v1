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

# ── DynamoDB (single-table design) ─────────────

resource "aws_dynamodb_table" "maintenance" {
  name         = "mtto-maintenance-${lower(var.stage)}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  attribute {
    name = "GSI3PK"
    type = "S"
  }

  attribute {
    name = "GSI3SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI3"
    hash_key        = "GSI3PK"
    range_key       = "GSI3SK"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.stage
    Project     = "MaintenanceAPI"
    ManagedBy   = "Terraform"
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
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          aws_dynamodb_table.maintenance.arn,
          "${aws_dynamodb_table.maintenance.arn}/index/*",
        ]
      }
    ]
  })
}

# ── SSM Parameters ─────────────────────────────

locals {
  ssm_root = "/MAINTENANCE-API/${var.stage}"
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

resource "aws_ssm_parameter" "dynamodb_table_name" {
  name        = "${local.ssm_root}/DYNAMODB_TABLE_NAME"
  description = "DynamoDB table name for maintenance-api ${var.stage}"
  type        = "String"
  value       = aws_dynamodb_table.maintenance.name
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
