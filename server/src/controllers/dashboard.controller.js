import * as dashboard from "../services/dashboard.service.js";

export async function getSummary(req, res, next) {
  try {
    const data = await dashboard.getDashboardSummary(req.user._id);
    res.json(data);
  } catch (e) {
    next(e);
  }
}
