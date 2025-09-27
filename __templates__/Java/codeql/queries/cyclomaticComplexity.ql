/**
 * @name Cyclomatic complexity
 * @description Computes the cyclomatic complexity for each Java class in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language java
 * @tags summary
 * @id java/cyclomatic-complexity
 */

import java

from Class c
where
  c.getFile().isSourceFile() and
  not c.getQualifiedName().matches("%test%")
select c.getFile().getRelativePath(), c.getMetrics().getCyclomaticComplexity()
