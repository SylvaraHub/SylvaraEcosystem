from typing import List, Dict, Any


def detect_volume_bursts(
    volumes: List[float],
    threshold_ratio: float = 1.5,
    min_interval: int = 1
) -> List[Dict[str, Any]]:
    """
    Identify indices where volume jumps by threshold_ratio over previous.
    Returns list of dicts: {index, previous, current, ratio, delta, timestamp?}.
    """
    events: List[Dict[str, Any]] = []
    last_idx = -min_interval
    for i in range(1, len(volumes)):
        prev, curr = volumes[i - 1], volumes[i]
        ratio = (curr / prev) if prev > 0 else float("inf")
        if ratio >= threshold_ratio and (i - last_idx) >= min_interval:
            delta = curr - prev
            events.append({
                "index": i,
                "previous": prev,
                "current": curr,
                "ratio": round(ratio, 4),
                "delta": delta,
                "percentage_change": round(((delta / prev) * 100), 2) if prev > 0 else float("inf")
            })
            last_idx = i
    return events


def summarize_bursts(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Provide a summary of detected bursts:
    - total events
    - average ratio
    - max delta
    - average percentage change
    """
    if not events:
        return {"total_events": 0, "average_ratio": 0, "max_delta": 0, "avg_pct_change": 0}

    total_events = len(events)
    avg_ratio = sum(e["ratio"] for e in events) / total_events
    max_delta = max(e["delta"] for e in events)
    avg_pct_change = sum(e["percentage_change"] for e in events) / total_events

    return {
        "total_events": total_events,
        "average_ratio": round(avg_ratio, 4),
        "max_delta": max_delta,
        "avg_pct_change": round(avg_pct_change, 2),
    }
