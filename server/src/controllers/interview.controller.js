import * as interview from "../services/interview.service.js";

export async function postStart(req, res, next) {
  try {
    const { role, durationMinutes = 30 } = req.body || {};
    const data = await interview.startSession(req.user._id, { role, durationMinutes });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
}

export async function postComplete(req, res, next) {
  try {
    const { answer } = req.body || {};
    const out = await interview.completeSession(req.user._id, req.params.id, { answer });
    res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const s = await interview.getSessionForUser(req.user._id, req.params.id);
    if (!s) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ session: s });
  } catch (e) {
    next(e);
  }
}
