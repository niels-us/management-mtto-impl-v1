terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "local" {
#    path = "terraform.tfstate"
    path = "terraform-dev.tfstate"
  }
}

provider "aws" {
  region = var.region
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

# Reference the default VPC — no cost, already exists in every AWS account
data "aws_vpc" "default" {
  default = true
}

# Reference default subnets for the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
