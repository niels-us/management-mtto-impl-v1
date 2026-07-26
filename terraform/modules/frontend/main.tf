resource "aws_s3_bucket" "frontend" {
  bucket        = "mtto-frontend-${var.account_id}-${lower(var.stage)}"
  force_destroy = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Disabled"
  }
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "mtto-frontend-oac-${lower(var.stage)}"
  description                       = "OAC for mtto frontend ${var.stage}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "frontend-origin"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Frontend hosting for mtto ${var.stage}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  aliases = var.frontend_domain != "" ? [var.frontend_domain] : []

  viewer_certificate {
    cloudfront_default_certificate = var.frontend_domain == "" ? true : false
    acm_certificate_arn            = var.frontend_domain != "" ? var.frontend_certificate_arn : null
    ssl_support_method             = var.frontend_domain != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  default_cache_behavior {
    target_origin_id       = "frontend-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "mtto-frontend-${lower(var.stage)}"
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${var.account_id}:distribution/${aws_cloudfront_distribution.frontend.id}"
          }
        }
      }
    ]
  })
}
