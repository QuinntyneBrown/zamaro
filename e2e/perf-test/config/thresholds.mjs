// A row is flagged "Possible regression" when the median render is more than
// `relativeIncrease` and at least `absoluteMs` slower than the base branch, and
// the pull request's runs do not overlap the base branch's runs.
export const thresholds = {
  relativeIncrease: 0.1,
  absoluteMs: 1,
};

export const runs = 10;
export const renderTypes = ['mount'];
