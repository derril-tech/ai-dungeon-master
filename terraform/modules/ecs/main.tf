# Created automatically by Cursor AI (2024-12-19)

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.environment}-ecs-cluster"
    Environment = var.environment
  }
}

# ECS Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.environment}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Tasks (application role)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# CloudWatch Logs policy for ECS tasks
resource "aws_iam_policy" "ecs_task_logs_policy" {
  name        = "${var.environment}-ecs-task-logs-policy"
  description = "Policy for ECS tasks to write to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:*:*:*"
        ]
      }
    ]
  })
}

# Attach CloudWatch Logs policy to task role
resource "aws_iam_role_policy_attachment" "ecs_task_logs_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_logs_policy.arn
}

# Secrets Manager policy for ECS tasks
resource "aws_iam_policy" "ecs_task_secrets_policy" {
  name        = "${var.environment}-ecs-task-secrets-policy"
  description = "Policy for ECS tasks to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:*"
        ]
      }
    ]
  })
}

# Attach Secrets Manager policy to task role
resource "aws_iam_role_policy_attachment" "ecs_task_secrets_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_secrets_policy.arn
}

# S3 policy for ECS tasks (for file uploads/downloads)
resource "aws_iam_policy" "ecs_task_s3_policy" {
  name        = "${var.environment}-ecs-task-s3-policy"
  description = "Policy for ECS tasks to access S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.environment}-ai-dungeon-master-*",
          "arn:aws:s3:::${var.environment}-ai-dungeon-master-*/*"
        ]
      }
    ]
  })
}

# Attach S3 policy to task role
resource "aws_iam_role_policy_attachment" "ecs_task_s3_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_s3_policy.arn
}

# Auto Scaling Group for ECS (if using EC2 launch type)
resource "aws_autoscaling_group" "ecs" {
  count = var.use_ec2_launch_type ? 1 : 0

  name                = "${var.environment}-ecs-asg"
  desired_capacity    = var.desired_capacity
  max_size           = var.max_size
  min_size           = var.min_size
  target_group_arns  = var.target_group_arns
  vpc_zone_identifier = var.private_subnet_ids
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.ecs[0].id
    version = "$Latest"
  }

  tag {
    key                 = "AmazonECSManaged"
    value              = true
    propagate_at_launch = true
  }

  tag {
    key                 = "Name"
    value              = "${var.environment}-ecs-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value              = var.environment
    propagate_at_launch = true
  }
}

# Launch Template for ECS instances
resource "aws_launch_template" "ecs" {
  count = var.use_ec2_launch_type ? 1 : 0

  name_prefix   = "${var.environment}-ecs-"
  image_id      = var.ecs_ami_id
  instance_type = var.instance_type

  network_interfaces {
    associate_public_ip_address = false
    security_groups            = [var.ecs_security_group_id]
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs[0].name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    cluster_name = aws_ecs_cluster.main.name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.environment}-ecs-instance"
      Environment = var.environment
    }
  }
}

# IAM Instance Profile for ECS instances
resource "aws_iam_instance_profile" "ecs" {
  count = var.use_ec2_launch_type ? 1 : 0

  name = "${var.environment}-ecs-instance-profile"
  role = aws_iam_role.ecs_instance_role[0].name
}

# IAM Role for ECS instances
resource "aws_iam_role" "ecs_instance_role" {
  count = var.use_ec2_launch_type ? 1 : 0

  name = "${var.environment}-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach ECS instance policy
resource "aws_iam_role_policy_attachment" "ecs_instance_role_policy" {
  count = var.use_ec2_launch_type ? 1 : 0

  role       = aws_iam_role.ecs_instance_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}
