/**
 * Jest tests for Docker Release Workflow (T-14.3)
 * Validates multi-arch Docker image publishing to GHCR
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const DockerReleaseValidator = require('../scripts/test-docker-release');

describe('T-14.3: Docker Image Publish', () => {
  let validator;
  let workflowPath;
  let workflow;

  beforeAll(() => {
    validator = new DockerReleaseValidator();
    workflowPath = path.join(
      __dirname,
      '..',
      '.github',
      'workflows',
      'release.yml'
    );

    if (fs.existsSync(workflowPath)) {
      const content = fs.readFileSync(workflowPath, 'utf8');
      workflow = yaml.load(content);
    }
  });

  describe('Workflow File Existence', () => {
    test('should have release.yml workflow file', () => {
      expect(fs.existsSync(workflowPath)).toBe(true);
    });

    test('should be valid YAML', () => {
      expect(() => {
        const content = fs.readFileSync(workflowPath, 'utf8');
        yaml.load(content);
      }).not.toThrow();
    });
  });

  describe('Workflow Structure', () => {
    test('should have correct name', () => {
      expect(workflow.name).toBe('Release');
    });

    test('should trigger on release published', () => {
      expect(workflow.on.release).toBeDefined();
      expect(workflow.on.release.types).toContain('published');
    });

    test('should have workflow_dispatch for manual triggers', () => {
      expect(workflow.on.workflow_dispatch).toBeDefined();
      expect(workflow.on.workflow_dispatch.inputs.tag).toBeDefined();
    });

    test('should have required environment variables', () => {
      expect(workflow.env.REGISTRY).toBe('ghcr.io');
      expect(workflow.env.IMAGE_PREFIX).toContain('ghcr.io');
    });
  });

  describe('Multi-Architecture Support', () => {
    let buildJob;

    beforeAll(() => {
      buildJob = workflow.jobs['build-and-push'];
    });

    test('should have build-and-push job', () => {
      expect(buildJob).toBeDefined();
    });

    test('should setup Docker Buildx for multi-arch', () => {
      const buildxStep = buildJob.steps.find(
        (step) => step.uses && step.uses.includes('docker/setup-buildx-action')
      );

      expect(buildxStep).toBeDefined();
      expect(buildxStep.with.platforms).toContain('linux/amd64');
      expect(buildxStep.with.platforms).toContain('linux/arm64');
    });

    test('should build for multiple platforms', () => {
      const buildStep = buildJob.steps.find(
        (step) => step.uses && step.uses.includes('docker/build-push-action')
      );

      expect(buildStep).toBeDefined();
      expect(buildStep.with.platforms).toContain('linux/amd64');
      expect(buildStep.with.platforms).toContain('linux/arm64');
    });

    test('should enable push to registry', () => {
      const buildStep = buildJob.steps.find(
        (step) => step.uses && step.uses.includes('docker/build-push-action')
      );

      expect(buildStep.with.push).toBe(true);
    });
  });

  describe('GHCR Integration', () => {
    let buildJob;

    beforeAll(() => {
      buildJob = workflow.jobs['build-and-push'];
    });

    test('should have packages write permission', () => {
      expect(buildJob.permissions.packages).toBe('write');
      expect(buildJob.permissions.contents).toBe('read');
    });

    test('should login to GHCR', () => {
      const loginStep = buildJob.steps.find(
        (step) => step.uses && step.uses.includes('docker/login-action')
      );

      expect(loginStep).toBeDefined();
      expect(loginStep.with.registry).toBe('${{ env.REGISTRY }}');
      expect(loginStep.with.username).toBe('${{ github.actor }}');
      expect(loginStep.with.password).toBe('${{ secrets.GITHUB_TOKEN }}');
    });

    test('should extract metadata for tagging', () => {
      const metaStep = buildJob.steps.find(
        (step) => step.uses && step.uses.includes('docker/metadata-action')
      );

      expect(metaStep).toBeDefined();
      expect(metaStep.with.tags).toContain('type=ref,event=tag');
      expect(metaStep.with.tags).toContain('type=raw,value=latest');
    });
  });

  describe('Service Matrix Configuration', () => {
    let buildJob;

    beforeAll(() => {
      buildJob = workflow.jobs['build-and-push'];
    });

    test('should have strategy matrix', () => {
      expect(buildJob.strategy.matrix.service).toBeDefined();
    });

    test('should include all required services', () => {
      const services = buildJob.strategy.matrix.service.map((s) => s.name);
      const requiredServices = ['mobile', 'admin', 'backend', 'gateway'];

      requiredServices.forEach((service) => {
        expect(services).toContain(service);
      });
    });

    test('should have valid Dockerfile paths', () => {
      buildJob.strategy.matrix.service.forEach((service) => {
        const dockerfilePath = path.join(__dirname, '..', service.dockerfile);
        expect(fs.existsSync(dockerfilePath)).toBe(true);
      });
    });

    test('should have correct context for each service', () => {
      buildJob.strategy.matrix.service.forEach((service) => {
        expect(service.context).toBe('.');
      });
    });
  });

  describe('Security Scanning', () => {
    let securityJob;

    beforeAll(() => {
      securityJob = workflow.jobs['security-scan'];
    });

    test('should have security-scan job', () => {
      expect(securityJob).toBeDefined();
    });

    test('should depend on build-and-push job', () => {
      expect(securityJob.needs).toContain('build-and-push');
    });

    test('should have security-events write permission', () => {
      expect(securityJob.permissions['security-events']).toBe('write');
    });

    test('should use Trivy scanner', () => {
      const trivyStep = securityJob.steps.find(
        (step) => step.uses && step.uses.includes('aquasecurity/trivy-action')
      );

      expect(trivyStep).toBeDefined();
      expect(trivyStep.with.format).toBe('sarif');
    });

    test('should upload SARIF results', () => {
      const uploadStep = securityJob.steps.find(
        (step) =>
          step.uses && step.uses.includes('github/codeql-action/upload-sarif')
      );

      expect(uploadStep).toBeDefined();
      expect(uploadStep.if).toBe('always()');
    });
  });

  describe('Performance Optimizations', () => {
    let buildJob;

    beforeAll(() => {
      buildJob = workflow.jobs['build-and-push'];
    });

    test('should enable Docker layer caching', () => {
      const buildStep = buildJob.steps.find(
        (step) => step.uses && step.uses.includes('docker/build-push-action')
      );

      expect(buildStep.with['cache-from']).toBe('type=gha');
      expect(buildStep.with['cache-to']).toBe('type=gha,mode=max');
    });

    test('should enable inline cache', () => {
      const buildStep = buildJob.steps.find(
        (step) => step.uses && step.uses.includes('docker/build-push-action')
      );

      expect(buildStep.with['build-args']).toContain('BUILDKIT_INLINE_CACHE=1');
    });
  });

  describe('Deployment Integration', () => {
    let deployJob;

    beforeAll(() => {
      deployJob = workflow.jobs['update-deployment'];
    });

    test('should have update-deployment job', () => {
      expect(deployJob).toBeDefined();
    });

    test('should only run on release events', () => {
      expect(deployJob.if).toBe("github.event_name == 'release'");
    });

    test('should depend on build and security jobs', () => {
      expect(deployJob.needs).toContain('build-and-push');
      expect(deployJob.needs).toContain('security-scan');
    });
  });

  describe('Notification System', () => {
    let notifyJob;

    beforeAll(() => {
      notifyJob = workflow.jobs['notify'];
    });

    test('should have notify job', () => {
      expect(notifyJob).toBeDefined();
    });

    test('should run always on release', () => {
      expect(notifyJob.if).toContain('always()');
      expect(notifyJob.if).toContain("github.event_name == 'release'");
    });

    test('should create deployment status', () => {
      const scriptStep = notifyJob.steps.find(
        (step) => step.uses && step.uses.includes('actions/github-script')
      );

      expect(scriptStep).toBeDefined();
      expect(scriptStep.with.script).toContain('createDeploymentStatus');
    });
  });

  describe('Integration Test', () => {
    test('should pass full validation', async () => {
      const result = await validator.run();
      expect(result).toBe(true);
    });

    test('should have no validation errors', () => {
      expect(validator.errors.length).toBe(0);
    });
  });

  describe('Release Trigger Simulation', () => {
    test('should handle release published event', () => {
      const releaseTypes = workflow.on.release.types;
      expect(releaseTypes).toContain('published');
    });

    test('should handle manual workflow dispatch', () => {
      expect(workflow.on.workflow_dispatch).toBeDefined();
      expect(workflow.on.workflow_dispatch.inputs.tag.required).toBe(true);
    });
  });
});

describe('Docker Release Validator Class', () => {
  let validator;

  beforeEach(() => {
    validator = new DockerReleaseValidator();
  });

  test('should initialize with empty errors and warnings', () => {
    expect(validator.errors).toEqual([]);
    expect(validator.warnings).toEqual([]);
  });

  test('should validate workflow exists', () => {
    const result = validator.validateWorkflowExists();
    expect(result).toBe(true);
  });

  test('should generate report', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = validator.generateReport();
    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
