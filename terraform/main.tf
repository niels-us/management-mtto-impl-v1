terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "local" {
    path = "terraform-dev.tfstate"
  }
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile

  default_tags {
    tags = {
      Environment = var.stage
      Project     = "MaintenanceAPI"
      ManagedBy   = "Terraform"
      FOCODAMB    = "DEV"
      FOCODAPP    = "MAINTENANCEAPI"
    }
  }
}

module "backend" {
  source = "./modules/backend"

  region      = var.region
  stage       = var.stage
  account_id  = var.account_id
  jwt_secret  = var.jwt_secret
  groq_api_key = var.groq_api_key
}

module "frontend" {
  source = "./modules/frontend"

  stage                   = var.stage
  account_id              = var.account_id
  frontend_domain         = var.frontend_domain
  frontend_certificate_arn = var.frontend_certificate_arn
}
