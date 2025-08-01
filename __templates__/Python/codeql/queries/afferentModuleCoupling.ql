/**
 * @name Afferent Coupling per Module (Python)
 * @description Computes afferent coupling for each Python module in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language python
 * @tags summary
 * @id python/afferent-coupling-module
 */

import python

from ModuleMetrics m
where
  m.inSource() and
  not m.getName().matches("%test%")
select m.getLocation().getFile().getRelativePath(), m.getAfferentCoupling()