// Risk scoring: simple, explainable rules (easy to defend in front of judges)
const computeRisk = (courses, highAlerts, mediumAlerts) => {
  let score = 0;
  const reasons = [];

  if (highAlerts) {
    score += Math.min(highAlerts * 15, 45);
    reasons.push(`${highAlerts} high-severity alert(s)`);
  }
  if (mediumAlerts) {
    score += Math.min(mediumAlerts * 5, 20);
    reasons.push(`${mediumAlerts} medium-severity alert(s)`);
  }

  if (courses.some((c) => c.utilisation >= 100)) {
    score += 10;
    reasons.push("Approved intake fully utilised");
  }

  const total = courses.reduce((n, c) => n + c.total, 0);
  const supernumerary = courses.reduce((n, c) => n + c.supernumerary, 0);
  const foreign = courses.reduce((n, c) => n + c.nri + c.foreignNational, 0);

  if (total && supernumerary / total > 0.15) {
    score += 15;
    reasons.push("Supernumerary seats above 15% of enrolment");
  }
  if (total && foreign / total > 0.2) {
    score += 10;
    reasons.push("NRI / Foreign National share above 20%");
  }

  // Year-on-year enrolment spike (needs two academic years for the same course)
  const byCourse = {};
  courses.forEach((c) => (byCourse[c.courseName] = [...(byCourse[c.courseName] || []), c]));
  Object.values(byCourse).forEach((list) => {
    if (list.length < 2) return;
    list.sort((a, b) => a.academicYear.localeCompare(b.academicYear));
    const prev = list[list.length - 2];
    const last = list[list.length - 1];
    if (prev.total > 0 && (last.total - prev.total) / prev.total > 0.3) {
      score += 20;
      reasons.push(`Enrolment spike in ${last.courseName} (${last.academicYear})`);
    }
  });

  score = Math.min(score, 100);
  const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, reasons };
};

const buildInstitutionStats = (institutions, studentRows, alertRows) =>
  institutions.map((inst) => {
    const courses = inst.courses.map((c) => {
      const row =
        studentRows.find(
          (r) =>
            String(r._id.institution) === String(inst._id) &&
            r._id.course === c.courseName &&
            r._id.academicYear === c.academicYear
        ) || {};
      const enrolled = row.enrolled || 0;
      const supernumerary = row.supernumerary || 0;
      return {
        courseName: c.courseName,
        academicYear: c.academicYear,
        approvedIntake: c.approvedIntake,
        enrolled,
        supernumerary,
        total: enrolled + supernumerary,
        nri: row.nri || 0,
        oci: row.oci || 0,
        foreignNational: row.fn || 0,
        utilisation: c.approvedIntake ? Math.round((enrolled / c.approvedIntake) * 100) : 0,
      };
    });

    const countAlerts = (sev) =>
      alertRows
        .filter((a) => String(a._id.institution) === String(inst._id) && a._id.severity === sev)
        .reduce((n, a) => n + a.count, 0);

    const openAlerts = { high: countAlerts("high"), medium: countAlerts("medium"), low: countAlerts("low") };

    return {
      institutionId: inst._id,
      name: inst.name,
      aicteId: inst.aicteId,
      state: inst.state,
      city: inst.city,
      courses,
      openAlerts,
      risk: computeRisk(courses, openAlerts.high, openAlerts.medium),
    };
  });

module.exports = { computeRisk, buildInstitutionStats };