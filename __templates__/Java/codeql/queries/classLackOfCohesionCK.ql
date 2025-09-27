/**
 * @name Chidamber-Kemerer lack of cohesion (Java)
 * @description Computes Chidamber-Kemerer lack of cohesion for each Java class in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language java
 * @tags summary
 * @id java/lack-cohesion-ck
 */

import java

from Class c
where
  c.getFile().isSourceFile() and
  not c.getQualifiedName().matches("%test%")
select c.getFile().getRelativePath(), c.getMetrics().getLackOfCohesionCK()