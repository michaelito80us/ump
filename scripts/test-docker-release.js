#!/usr/bin/env node
/**
 * Test script for Docker release workflow validation
 * Tests T-14.3 implementation requirements
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class DockerReleaseValidator {
  constructor() {
    this.workflowPath = path.join(
      __dirname,
      '..',
      '.github',
      'workflows',
      'release.yml'
    );
    this.errors = [];
    this.warnings = [];
  }

  validateWorkflowExists() {
    if (!fs.existsSync(this.workflowPath)) {
      this.errors.push('Release workflow file does not exist');
      return false;
    }
    return true;
  }

  validateWorkflowStructure() {
    try {
      const content = fs.readFileSync(this.workflowPath, 'utf8');
      const workflow = yaml.load(content);

      // Check basic structure
      if (!workflow.name) {
        this.errors.push('Workflow missing name');
      }

      // Check triggers
      if (!workflow.on || !workflow.on.release) {
        this.errors.push('Workflow missing release trigger');
      }

      if (
        !workflow.on.release.types ||
        !workflow.on.release.types.includes('published')
      ) {
        this.errors.push('Workflow missing published release trigger');
      }

      // Check jobs
      if (!workflow.jobs || !workflow.jobs['build-and-push']) {
        this.errors.push('Workflow missing build-and-push job');
      }

      return workflow;
    } catch (error) {
      this.errors.push(`Failed to parse workflow YAML: ${error.message}`);
      return null;
    }
  }

  validateMultiArchSupport(workflow) {
    const buildJob = workflow.jobs['build-and-push'];
    if (!buildJob) return;

    const buildxStep = buildJob.steps?.find(
      (step) => step.uses && step.uses.includes('docker/setup-buildx-action')
    );

    if (!buildxStep) {
      this.errors.push('Missing Docker Buildx setup for multi-arch builds');
      return;
    }

    if (
      !buildxStep.with?.platforms ||
      !buildxStep.with.platforms.includes('linux/amd64') ||
      !buildxStep.with.platforms.includes('linux/arm64')
    ) {
      this.errors.push('Missing required platforms (linux/amd64, linux/arm64)');
    }

    const buildStep = buildJob.steps?.find(
      (step) => step.uses && step.uses.includes('docker/build-push-action')
    );

    if (!buildStep?.with?.platforms) {
      this.errors.push('Build step missing platforms configuration');
    }
  }

  validateGHCRIntegration(workflow) {
    // Check registry configuration
    if (!workflow.env?.REGISTRY || workflow.env.REGISTRY !== 'ghcr.io') {
      this.errors.push('Missing or incorrect GHCR registry configuration');
    }

    // Check login step
    const buildJob = workflow.jobs['build-and-push'];
    const loginStep = buildJob?.steps?.find(
      (step) => step.uses && step.uses.includes('docker/login-action')
    );

    if (!loginStep) {
      this.errors.push('Missing Docker registry login step');
    }

    if (loginStep?.with?.registry !== '${{ env.REGISTRY }}') {
      this.warnings.push('Login step should use env.REGISTRY variable');
    }

    // Check permissions
    if (
      !buildJob?.permissions?.packages ||
      buildJob.permissions.packages !== 'write'
    ) {
      this.errors.push('Missing packages write permission for GHCR');
    }
  }

  validateServiceMatrix(workflow) {
    const buildJob = workflow.jobs['build-and-push'];
    const matrix = buildJob?.strategy?.matrix;

    if (!matrix?.service) {
      this.errors.push('Missing service matrix configuration');
      return;
    }

    const requiredServices = ['mobile', 'admin', 'backend', 'gateway'];
    const configuredServices = matrix.service.map((s) => s.name);

    for (const service of requiredServices) {
      if (!configuredServices.includes(service)) {
        this.errors.push(`Missing service in matrix: ${service}`);
      }
    }

    // Validate Dockerfile paths
    for (const service of matrix.service) {
      const dockerfilePath = path.join(__dirname, '..', service.dockerfile);
      if (!fs.existsSync(dockerfilePath)) {
        this.errors.push(`Dockerfile not found: ${service.dockerfile}`);
      }
    }
  }

  validateSecurityScanning(workflow) {
    if (!workflow.jobs['security-scan']) {
      this.warnings.push('Missing security scanning job');
      return;
    }

    const scanJob = workflow.jobs['security-scan'];
    const trivyStep = scanJob.steps?.find(
      (step) => step.uses && step.uses.includes('aquasecurity/trivy-action')
    );

    if (!trivyStep) {
      this.warnings.push('Missing Trivy security scanner');
    }
  }

  validateCaching(workflow) {
    const buildJob = workflow.jobs['build-and-push'];
    const buildStep = buildJob?.steps?.find(
      (step) => step.uses && step.uses.includes('docker/build-push-action')
    );

    if (!buildStep?.with?.['cache-from'] || !buildStep?.with?.['cache-to']) {
      this.warnings.push('Missing Docker layer caching configuration');
    }
  }

  async simulateReleaseTrigger() {
    // Simulate what happens when a release is published
    console.log('\n🧪 Simulating release trigger...');

    const mockEvent = {
      action: 'published',
      release: {
        tag_name: 'v1.0.0',
        name: 'Release v1.0.0',
      },
    };

    console.log(`   📦 Mock release: ${mockEvent.release.tag_name}`);
    console.log('   ✅ Workflow would trigger on release.published');

    return true;
  }

  generateReport() {
    console.log('\n📋 Docker Release Workflow Validation Report');
    console.log('='.repeat(50));

    if (this.errors.length === 0) {
      console.log('✅ All validation checks passed!');
    } else {
      console.log(`❌ Found ${this.errors.length} error(s):`);
      this.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Found ${this.warnings.length} warning(s):`);
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }

    console.log('\n📊 Validation Summary:');
    console.log(`   ✅ Errors: ${this.errors.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);

    return this.errors.length === 0;
  }

  async run() {
    console.log('🚀 Starting Docker Release Workflow Validation (T-14.3)');

    if (!this.validateWorkflowExists()) {
      return this.generateReport();
    }

    const workflow = this.validateWorkflowStructure();
    if (!workflow) {
      return this.generateReport();
    }

    this.validateMultiArchSupport(workflow);
    this.validateGHCRIntegration(workflow);
    this.validateServiceMatrix(workflow);
    this.validateSecurityScanning(workflow);
    this.validateCaching(workflow);

    await this.simulateReleaseTrigger();

    return this.generateReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DockerReleaseValidator();
  validator
    .run()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = DockerReleaseValidator;
