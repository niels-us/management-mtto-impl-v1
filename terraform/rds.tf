resource "aws_db_subnet_group" "default" {
  name       = "maintenance-api-desa-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  description = "Default subnet group for maintenance-api DESA RDS"
}

resource "aws_db_instance" "postgres" {
  identifier        = "maintenance-api-desa"
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

  # Free Tier eligible: no Multi-AZ, no read replica
  multi_az = false

  # Backups
  backup_retention_period = 0
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # DESA: skip final snapshot to allow easy destroy
  skip_final_snapshot = true
  deletion_protection = false

  # Performance
  auto_minor_version_upgrade = true

  # SSL certificate
  ca_cert_identifier = "rds-ca-rsa2048-g1"
}
