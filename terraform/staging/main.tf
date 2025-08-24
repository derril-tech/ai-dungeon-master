# Created automatically by Cursor AI (2024-12-19)

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "ai-dungeon-master-terraform-state-staging"
    key    = "staging/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = "staging"
      Project     = "ai-dungeon-master"
      ManagedBy   = "terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "../modules/vpc"
  
  environment = "staging"
  vpc_cidr    = "10.0.0.0/16"
  
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]
  
  availability_zones = ["us-east-1a", "us-east-1b"]
}

# ECS Cluster
module "ecs" {
  source = "../modules/ecs"
  
  environment = "staging"
  vpc_id      = module.vpc.vpc_id
  
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  
  depends_on = [module.vpc]
}

# RDS Database
module "rds" {
  source = "../modules/rds"
  
  environment = "staging"
  vpc_id      = module.vpc.vpc_id
  
  subnet_ids = module.vpc.private_subnet_ids
  
  instance_class = "db.t3.micro"
  allocated_storage = 20
  
  depends_on = [module.vpc]
}

# ElastiCache Redis
module "redis" {
  source = "../modules/redis"
  
  environment = "staging"
  vpc_id      = module.vpc.vpc_id
  
  subnet_ids = module.vpc.private_subnet_ids
  
  node_type = "cache.t3.micro"
  num_cache_nodes = 1
  
  depends_on = [module.vpc]
}

# Application Load Balancer
module "alb" {
  source = "../modules/alb"
  
  environment = "staging"
  vpc_id      = module.vpc.vpc_id
  
  subnet_ids = module.vpc.public_subnet_ids
  
  depends_on = [module.vpc]
}

# ECS Services
module "frontend" {
  source = "../modules/ecs-service"
  
  environment = "staging"
  service_name = "frontend"
  
  cluster_id = module.ecs.cluster_id
  vpc_id     = module.vpc.vpc_id
  
  subnet_ids = module.vpc.private_subnet_ids
  
  image = var.frontend_image
  port  = 3000
  
  cpu    = 256
  memory = 512
  
  desired_count = 1
  
  load_balancer_arn = module.alb.alb_arn
  target_group_arn  = module.alb.frontend_target_group_arn
  
  environment_variables = {
    NEXT_PUBLIC_API_URL = "https://api-staging.ai-dungeon-master.com"
    NEXT_PUBLIC_WS_URL   = "wss://api-staging.ai-dungeon-master.com"
  }
  
  depends_on = [module.ecs, module.alb]
}

module "gateway" {
  source = "../modules/ecs-service"
  
  environment = "staging"
  service_name = "gateway"
  
  cluster_id = module.ecs.cluster_id
  vpc_id     = module.vpc.vpc_id
  
  subnet_ids = module.vpc.private_subnet_ids
  
  image = var.gateway_image
  port  = 3000
  
  cpu    = 512
  memory = 1024
  
  desired_count = 1
  
  load_balancer_arn = module.alb.alb_arn
  target_group_arn  = module.alb.gateway_target_group_arn
  
  environment_variables = {
    DATABASE_URL = module.rds.connection_string
    REDIS_URL    = module.redis.connection_string
    JWT_SECRET   = var.jwt_secret
  }
  
  secrets = {
    DATABASE_PASSWORD = module.rds.db_password_arn
    JWT_SECRET        = var.jwt_secret_arn
  }
  
  depends_on = [module.ecs, module.alb, module.rds, module.redis]
}

module "orchestrator" {
  source = "../modules/ecs-service"
  
  environment = "staging"
  service_name = "orchestrator"
  
  cluster_id = module.ecs.cluster_id
  vpc_id     = module.vpc.vpc_id
  
  subnet_ids = module.vpc.private_subnet_ids
  
  image = var.orchestrator_image
  port  = 8000
  
  cpu    = 1024
  memory = 2048
  
  desired_count = 1
  
  load_balancer_arn = module.alb.alb_arn
  target_group_arn  = module.alb.orchestrator_target_group_arn
  
  environment_variables = {
    DATABASE_URL = module.rds.connection_string
    REDIS_URL    = module.redis.connection_string
    NATS_URL     = var.nats_url
  }
  
  secrets = {
    DATABASE_PASSWORD = module.rds.db_password_arn
    OPENAI_API_KEY   = var.openai_api_key_arn
  }
  
  depends_on = [module.ecs, module.alb, module.rds, module.redis]
}

module "workers" {
  source = "../modules/ecs-service"
  
  environment = "staging"
  service_name = "workers"
  
  cluster_id = module.ecs.cluster_id
  vpc_id     = module.vpc.vpc_id
  
  subnet_ids = module.vpc.private_subnet_ids
  
  image = var.workers_image
  port  = 8001
  
  cpu    = 1024
  memory = 2048
  
  desired_count = 1
  
  # Workers don't need load balancer
  load_balancer_arn = null
  target_group_arn  = null
  
  environment_variables = {
    DATABASE_URL = module.rds.connection_string
    REDIS_URL    = module.redis.connection_string
    NATS_URL     = var.nats_url
  }
  
  secrets = {
    DATABASE_PASSWORD = module.rds.db_password_arn
    OPENAI_API_KEY   = var.openai_api_key_arn
  }
  
  depends_on = [module.ecs, module.rds, module.redis]
}

# Route53 DNS
module "dns" {
  source = "../modules/dns"
  
  environment = "staging"
  domain_name = var.domain_name
  
  alb_dns_name = module.alb.alb_dns_name
  alb_zone_id  = module.alb.alb_zone_id
  
  depends_on = [module.alb]
}

# CloudWatch Logs
module "logs" {
  source = "../modules/logs"
  
  environment = "staging"
  
  log_groups = [
    "/ecs/staging/frontend",
    "/ecs/staging/gateway", 
    "/ecs/staging/orchestrator",
    "/ecs/staging/workers"
  ]
}

# CloudWatch Alarms
module "alarms" {
  source = "../modules/alarms"
  
  environment = "staging"
  
  alb_arn = module.alb.alb_arn
  
  rds_instance_id = module.rds.instance_id
  redis_replication_group_id = module.redis.replication_group_id
  
  depends_on = [module.alb, module.rds, module.redis]
}
