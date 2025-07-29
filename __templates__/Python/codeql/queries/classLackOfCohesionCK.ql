/**
 * @name Chidamber-Kemerer lack of cohesion (Python)
 * @description Computes Chidamber-Kemerer lack of cohesion for each Python class in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language python
 * @tags summary
 * @id python/lack-cohesion-ck
 */

import python

from Class c
where
  c.inSource() and
  not c.getQualifiedName().matches("%test%")
select c.getLocation().getFile().getRelativePath(), c.getMetrics().getLackOfCohesionCK()