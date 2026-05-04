FROM python:3.12-slim

# Bundles the three CLIs the scheduler workflow needs:
#   sam   — for backend deploys (template.yaml + lambdas)
#   aws   — for S3 sync + CloudFront invalidations on the frontend
#   node  — required by `sam build` for the nodejs Lambdas
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
      ca-certificates \
      gnupg \
      unzip \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && pip install --no-cache-dir aws-sam-cli \
    && curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/aws /tmp/awscliv2.zip \
    && apt-get purge -y --auto-remove unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/scheduler

ENTRYPOINT ["sam"]
CMD ["--help"]
