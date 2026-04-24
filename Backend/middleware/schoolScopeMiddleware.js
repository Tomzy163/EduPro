export const requireSchoolScope = (req, res, next) => {
  const userSchoolId = String(
    req.user?.school?._id || req.user?.schoolId || req.user?.school || ""
  ).trim();
  const requestSchoolId = String(
    req.body?.schoolId ||
      req.query?.schoolId ||
      req.headers["x-school-id"] ||
      ""
  ).trim();

  if (!requestSchoolId) {
    return res.status(400).json({
      message: "schoolId is required for this request.",
    });
  }

  if (!userSchoolId || requestSchoolId !== userSchoolId) {
    return res.status(403).json({
      message: "The supplied schoolId does not match the authenticated school.",
    });
  }

  req.schoolId = requestSchoolId;
  next();
};
