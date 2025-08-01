/**
 * @name Efferent Coupling per Module (Python)
 * @description Computes efferent coupling for each Python module in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language python
 * @tags summary
 * @id python/efferent-coupling-module
 */

import python

from ModuleMetrics m
where
  m.inSource() and
  not m.getName().matches("%test%")
select m.getLocation().getFile().getRelativePath(), m.getEfferentCoupling()