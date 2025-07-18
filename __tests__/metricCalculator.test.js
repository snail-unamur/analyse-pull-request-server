import { jest } from '@jest/globals';

// Mock modules BEFORE imports
jest.mock('../models/metrics/sonarQubeMetrics.js', () => ({
  __esModule: true,
  default: jest.fn(() => {
    console.log('Mocked retrieveSonarQubeMetrics called');
    return Promise.resolve([]);
  }),
}));

jest.mock('../models/metrics/codeQLMetrics.js', () => ({
  __esModule: true,
  default: jest.fn(() => {
    console.log('Mocked retrieveCodeQLArtifact called');
    return Promise.resolve([]);
  }),
}));

import retrieveSonarQubeMetrics from '../models/metrics/sonarQubeMetrics.js';
import retrieveCodeQLArtifact from '../models/metrics/codeQLMetrics.js';

import * as dataExamples from '../dataExamples/dataExamples.js';
import calculate from '../models/metricCalculator.js';

describe('Testing of the global calculation of metrics', () => {
  test('Category A', async () => {
    retrieveCodeQLArtifact.mockResolvedValue(dataExamples.codeqlMetricsCatA);
    retrieveSonarQubeMetrics.mockResolvedValue(dataExamples.sonarMetricsCatA);

    const radarMetrics = await calculate(null, dataExamples.pullRequest, 1);

    console.log('radarMetrics:', radarMetrics);

    expect(radarMetrics.riskValue).toBe(0);
    expect(radarMetrics.riskCategory).toBe('A');

    // Confirm mocks were called
    expect(retrieveCodeQLArtifact).toHaveBeenCalled();
    expect(retrieveSonarQubeMetrics).toHaveBeenCalled();
  });
});
