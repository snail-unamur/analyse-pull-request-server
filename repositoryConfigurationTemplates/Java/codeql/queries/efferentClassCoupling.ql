/**
 * @name Efferent Coupling per Class (Java)
 * @description Computes efferent coupling for each Java class in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language java
 * @tags summary
 * @id java/efferent-coupling
 */
import java

from Class c
where 
  c.getFile().isSourceFile() and 
  not c.getQualifiedName().matches("%test%")
select c.getFile().getRelativePath(), c.getEfferentCoupling()