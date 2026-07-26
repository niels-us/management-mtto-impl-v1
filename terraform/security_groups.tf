# Security group for RDS — allows inbound PostgreSQL from anywhere (DESA only)
resource "aws_security_group" "rds" {
  name        = "maintenance-api-rds-desa"
  description = "Allow inbound PostgreSQL for maintenance-api DESA"
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
