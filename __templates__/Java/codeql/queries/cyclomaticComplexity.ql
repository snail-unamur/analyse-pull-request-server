/**
 * @name Cyclomatic complexity
 * @description Computes the cyclomatic complexity for each Java class in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language java
 * @tags summary
 * @id java/complexity
 */

import java

from Class c
where
  c.inSource() and
  not c.getQualifiedName().matches("%test%")
select c.getLocation().getFile().getRelativePath(), c.getMetrics().getCyclomaticComplexity()
