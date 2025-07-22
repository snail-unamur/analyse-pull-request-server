// ESM-compatible Jest mocking
import { jest } from '@jest/globals';
import { codeqlMetricsCatB, codeqlMetricsCatC, codeqlMetricsCatD, codeqlMetricsCatE, sonarMetricsCatB, sonarMetricsCatC, sonarMetricsCatD, sonarMetricsCatE } from '../__data__/dataExamples.js';

// Mock modules using unstable_mockModule BEFORE importing them
jest.unstable_mockModule('../models/metrics/sonarQubeMetrics.js', () => ({
  __esModule: true,
  default: jest.fn(() => {
    console.log('Mocked retrieveSonarQubeMetrics called');
    return Promise.resolve([]);
  }),
}));

jest.unstable_mockModule('../models/metrics/codeQLMetrics.js', () => ({
  __esModule: true,
  default: jest.fn(() => {
    console.log('Mocked retrieveCodeQLArtifact called');
    return Promise.resolve([]);
  }),
}));

// Dynamically import after mocking
const retrieveSonarQubeMetricsModule = await import('../models/metrics/sonarQubeMetrics.js');
const retrieveCodeQLArtifactModule = await import('../models/metrics/codeQLMetrics.js');
const { configuration, codeqlMetricsCatA, sonarMetricsCatA } = await import('../__data__/dataExamples.js');
const calculate = (await import('../models/metricCalculator.js')).default;

describe('Testing of the global calculation of metrics', () => {
  test('Category A', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatA);
    retrieveSonarQubeMetricsModule.default.mockReturnValueOnce(sonarMetricsCatA);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.radarValue).toBe(0);
    })

    expect(radarMetrics.riskValue).toBe(0);
    expect(radarMetrics.riskCategory).toBe('A');
  });

  test('Category B', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatB);
    retrieveSonarQubeMetricsModule.default.mockReturnValueOnce(sonarMetricsCatB);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.radarValue).toBe(1);
    })

    expect(radarMetrics.riskValue).toBe(1);
    expect(radarMetrics.riskCategory).toBe('B');
  });

  test('Category C', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatC);
    retrieveSonarQubeMetricsModule.default.mockReturnValueOnce(sonarMetricsCatC);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.radarValue).toBe(2);
    })

    expect(radarMetrics.riskValue).toBe(2);
    expect(radarMetrics.riskCategory).toBe('C');
  });

  test('Category D', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatD);
    retrieveSonarQubeMetricsModule.default.mockReturnValueOnce(sonarMetricsCatD);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.radarValue).toBe(3);
    })

    expect(radarMetrics.riskValue).toBe(3);
    expect(radarMetrics.riskCategory).toBe('D');
  });

  test('Category E', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatE);
    retrieveSonarQubeMetricsModule.default.mockReturnValueOnce(sonarMetricsCatE);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.radarValue).toBe(4);
    })

    expect(radarMetrics.riskValue).toBe(4);
    expect(radarMetrics.riskCategory).toBe('E');
  });

  test('Empty metric', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce([]);
    retrieveSonarQubeMetricsModule.default.mockReturnValueOnce([]);

    const radarMetrics = await calculate(null, configuration, 1);

    expect(radarMetrics.riskValue).toBe(0);
    expect(radarMetrics.riskCategory).toBe('A');
  });
});
