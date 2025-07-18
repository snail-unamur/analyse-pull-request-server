/**
 * @name Efferent Coupling per Class (Python)
 * @description Computes efferent coupling for each Python class in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language python
 * @tags summary
 * @id python/efferent-coupling
 */

import python

from Class c
where
  c.inSource() and
  not c.getQualifiedName().matches("%test%")
select c.getLocation().getFile().getRelativePath(), c.getMetrics().getEfferentCoupling()