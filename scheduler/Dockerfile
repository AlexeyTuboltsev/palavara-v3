FROM python:3.12-slim

# AWS SAM CLI requires Python; sam build for nodejs Lambdas needs npm + node.
# pip-installing sam-cli is the upstream-recommended path on Linux.
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
      ca-certificates \
      gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && pip install --no-cache-dir aws-sam-cli \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/scheduler

ENTRYPOINT ["sam"]
CMD ["--help"]
