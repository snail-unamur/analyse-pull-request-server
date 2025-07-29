// ESM-compatible Jest mocking
import { jest } from '@jest/globals';
import { codeqlMetricsCatB, codeqlMetricsCatC, codeqlMetricsCatD, codeqlMetricsCatE, sonarMetricsCatB, sonarMetricsCatC, sonarMetricsCatD, sonarMetricsCatE } from '../__data__/dataExamples.js';

// Mock modules using unstable_mockModule BEFORE importing them
jest.unstable_mockModule('../models/metrics/sonarMetrics.js', () => ({
  __esModule: true,
  default: jest.fn(() => {
    console.log('Mocked retrieveSonarMetrics called');
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
const retrieveSonarMetricsModule = await import('../models/metrics/sonarMetrics.js');
const retrieveCodeQLArtifactModule = await import('../models/metrics/codeQLMetrics.js');
const { configuration, codeqlMetricsCatA, sonarMetricsCatA } = await import('../__data__/dataExamples.js');
const calculate = (await import('../models/metricCalculator.js')).default;

describe('Testing of the global calculation of metrics', () => {
  test('Category A', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatA);
    retrieveSonarMetricsModule.default.mockReturnValueOnce(sonarMetricsCatA);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.value).toBe(0);
    })

    expect(radarMetrics.riskValue).toBe(0);
  });

  test('Category B', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatB);
    retrieveSonarMetricsModule.default.mockReturnValueOnce(sonarMetricsCatB);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.value).toBe(1);
    })

    expect(radarMetrics.riskValue).toBe(38.97114317029975);
  });

  test('Category C', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatC);
    retrieveSonarMetricsModule.default.mockReturnValueOnce(sonarMetricsCatC);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.value).toBe(2);
    })

    expect(radarMetrics.riskValue).toBe(467.65371804359694);
  });

  test('Category D', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatD);
    retrieveSonarMetricsModule.default.mockReturnValueOnce(sonarMetricsCatD);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.value).toBe(3);
    })

    expect(radarMetrics.riskValue).toBe(2922.835737772481);
  });

  test('Category E', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce(codeqlMetricsCatE);
    retrieveSonarMetricsModule.default.mockReturnValueOnce(sonarMetricsCatE);

    const radarMetrics = await calculate(null, configuration, 1);

    radarMetrics.radarMetrics.forEach(m => {
      expect(m.value).toBe(4);
    })

    expect(radarMetrics.riskValue).toBe(21823.840175367855);
  });

  test('Empty metric', async () => {
    retrieveCodeQLArtifactModule.default.mockReturnValueOnce([]);
    retrieveSonarMetricsModule.default.mockReturnValueOnce([]);

    const radarMetrics = await calculate(null, configuration, 1);

    expect(radarMetrics.riskValue).toBe(0);
  });
});
