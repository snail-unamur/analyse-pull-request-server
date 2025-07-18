/**
 * @name Afferent Coupling per Class (Python)
 * @description Computes afferent coupling for each Python class in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language python
 * @tags summary
 * @id python/afferent-coupling
 */

import python

from Class c
where
  c.inSource() and
  not c.getQualifiedName().matches("%test%")
select c.getLocation().getFile().getRelativePath(), c.getMetrics().getAfferentCoupling()