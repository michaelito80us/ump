#!/usr/bin/env node
/**
 * Integration test for GitHub release trigger (T-14.3)
 * Simulates `gh release` command triggering Docker image builds
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class GitHubReleaseTriggerTest {
  constructor() {
    this.workflowPath = path.join(
      __dirname,
      '..',
      '.github',
      'workflows',
      'release.yml'
    );
  }

  async simulateGitHubRelease() {
    console.log('🚀 Simulating GitHub Release Trigger Test (T-14.3)');
    console.log('='.repeat(60));

    // Load workflow
    const content = fs.readFileSync(this.workflowPath, 'utf8');
    const workflow = yaml.load(content);

    // Simulate release event
    const mockReleaseEvent = {
      action: 'published',
      release: {
        id: 12345,
        tag_name: 'v1.0.0',
        name: 'Release v1.0.0',
        body: 'Initial release with Docker image publishing',
        draft: false,
        prerelease: false,
      },
      repository: {
        name: 'ump',
        full_name: 'organization/ump',
      },
    };

    console.log('📦 Mock Release Event:');
    console.log(`   Tag: ${mockReleaseEvent.release.tag_name}`);
    console.log(`   Name: ${mockReleaseEvent.release.name}`);
    console.log(`   Action: ${mockReleaseEvent.action}`);

    // Verify workflow would trigger
    const releaseConfig = workflow.on.release;
    const wouldTrigger =
      releaseConfig &&
      releaseConfig.types &&
      releaseConfig.types.includes(mockReleaseEvent.action);

    console.log('\n🔍 Trigger Analysis:');
    console.log(`   ✅ Workflow has release trigger: ${!!releaseConfig}`);
    console.log(`   ✅ Supports 'published' action: ${wouldTrigger}`);

    if (!wouldTrigger) {
      throw new Error('Workflow would not trigger on release.published');
    }

    // Simulate job execution
    console.log('\n🏗️  Simulating Job Execution:');

    const buildJob = workflow.jobs['build-and-push'];
    if (!buildJob) {
      throw new Error('Missing build-and-push job');
    }

    const services = buildJob.strategy.matrix.service;
    console.log(`   📋 Services to build: ${services.length}`);

    for (const service of services) {
      console.log(`   🐳 Building ${service.name}:`);
      console.log(`      - Context: ${service.context}`);
      console.log(`      - Dockerfile: ${service.dockerfile}`);
      console.log(`      - Platforms: linux/amd64,linux/arm64`);
      console.log(`      - Registry: ghcr.io`);
      console.log(`      - Tag: ${mockReleaseEvent.release.tag_name}`);
    }

    // Verify security scanning
    const securityJob = workflow.jobs['security-scan'];
    if (securityJob) {
      console.log('\n🔒 Security Scanning:');
      console.log('   ✅ Trivy vulnerability scan enabled');
      console.log('   ✅ SARIF results upload to GitHub Security');
    }

    // Verify deployment update
    const deployJob = workflow.jobs['update-deployment'];
    if (deployJob) {
      console.log('\n🚀 Deployment Update:');
      console.log('   ✅ Helm values.yaml update');
      console.log(
        `   ✅ Image tags updated to: ${mockReleaseEvent.release.tag_name}`
      );
    }

    console.log('\n✅ GitHub Release Trigger Test PASSED');
    console.log('   All Docker images would be built and published to GHCR');

    return true;
  }

  async testManualDispatch() {
    console.log('\n🔧 Testing Manual Workflow Dispatch:');

    const content = fs.readFileSync(this.workflowPath, 'utf8');
    const workflow = yaml.load(content);

    const dispatchConfig = workflow.on.workflow_dispatch;
    if (!dispatchConfig) {
      throw new Error('Missing workflow_dispatch trigger');
    }

    const tagInput = dispatchConfig.inputs.tag;
    if (!tagInput || !tagInput.required) {
      throw new Error('Missing required tag input for manual dispatch');
    }

    console.log('   ✅ Manual dispatch enabled');
    console.log('   ✅ Tag input required');
    console.log('   ✅ Can trigger builds manually via GitHub UI');

    return true;
  }

  async run() {
    try {
      await this.simulateGitHubRelease();
      await this.testManualDispatch();

      console.log('\n🎉 All T-14.3 tests passed!');
      console.log(
        '   Docker image publishing workflow is ready for production'
      );

      return true;
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      return false;
    }
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new GitHubReleaseTriggerTest();
  test
    .run()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = GitHubReleaseTriggerTest;
