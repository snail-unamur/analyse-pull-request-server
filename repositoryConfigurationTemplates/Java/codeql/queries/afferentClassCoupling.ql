/**
 * @name Afferent Coupling per Class (Java)
 * @description Computes afferent coupling for each Java class in source files (excluding tests).
 * @kind metric
 * @metricType count
 * @language java
 * @tags summary 
 * @id java/afferent-coupling
 */
import java

from Class c
where 
  c.getFile().isSourceFile() and 
  not c.getQualifiedName().matches("%test%")
select c.getFile().getRelativePath(), c.getAfferentCoupling()