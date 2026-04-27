import * as ai from "../services/ai.service.js";

export async function postCodeReview(req, res, next) {
  try {
    const result = await ai.reviewCode(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function postCoachExplain(req, res, next) {
  try {
    const result = await ai.coachExplain(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function postCoachHint(req, res, next) {
  try {
    const result = await ai.coachHint(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function postCoachCompare(req, res, next) {
  try {
    const result = await ai.coachCompare(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function postWeakness(req, res, next) {
  try {
    const result = await ai.analyzeWeakness(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function postMockEvaluate(req, res, next) {
  try {
    const result = await ai.evaluateMockAnswer(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function postRoadmap(req, res, next) {
  try {
    const result = await ai.generateRoadmap(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function postSubmissionMentor(req, res, next) {
  try {
    const result = await ai.submissionMentor(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
