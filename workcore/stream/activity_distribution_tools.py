from typing import List, Tuple, Dict

def generate_activity_heatmap(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> List[float]:
    """
    Bucket activity counts into 'buckets' time intervals,
    returning either raw counts or normalized [0.0–1.0].
    - timestamps: list of epoch ms timestamps.
    - counts: list of integer counts per timestamp.
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return []

    t_min, t_max = min(timestamps), max(timestamps)
    span = t_max - t_min or 1
    bucket_size = span / buckets

    agg = [0] * buckets
    for t, c in zip(timestamps, counts):
        idx = min(buckets - 1, int((t - t_min) / bucket_size))
        agg[idx] += c

    if normalize:
        m = max(agg) or 1
        return [round(val / m, 4) for val in agg]
    return agg


def generate_activity_heatmap_with_meta(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> Dict[str, object]:
    """
    Extended version: returns both the heatmap and metadata about the distribution.
    """
    values = generate_activity_heatmap(timestamps, counts, buckets, normalize)
    total = sum(values) if not normalize else sum(counts)
    return {
        "heatmap": values,
        "bucket_count": buckets,
        "normalized": normalize,
        "total_activity": total,
        "time_span": (min(timestamps), max(timestamps)) if timestamps else (0, 0)
    }
