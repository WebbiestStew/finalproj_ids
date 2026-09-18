function validationError(res, parsed) {
  return res.status(400).json({ error: parsed.error.issues.map((i) => i.message) });
}

module.exports = { validationError };
