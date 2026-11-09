"""Regenerate edited Freesound effects from licensed canonical PCM sources.

Source licenses, authors, original URLs, hashes and edit parameters:
assets/audio/reference-sources/sources.json. Python standard library only.
"""
import array
import hashlib
import json
import math
from pathlib import Path
import sys
import wave

ROOT = Path(__file__).resolve().parents[1] / "assets/audio"
RATE = 22050
MANIFEST = json.loads((ROOT / "reference-sources/sources.json").read_text())


def read_source(sound_id):
    path = ROOT / "reference-sources" / f"{sound_id}.wav"
    assert hashlib.sha256(path.read_bytes()).hexdigest() == MANIFEST["sources"][sound_id]["pcmSha256"]
    with wave.open(str(path), "rb") as source:
        assert (source.getnchannels(), source.getsampwidth(), source.getframerate()) == (1, 2, RATE)
        samples = array.array("h", source.readframes(source.getnframes()))
    if sys.byteorder != "little":
        samples.byteswap()
    return [value / 32768 for value in samples]


def filter_clip(samples, highpass, lowpass):
    high_alpha = 1 / (1 + 2 * math.pi * highpass / RATE)
    low_alpha = 1 / (1 + RATE / (2 * math.pi * lowpass))
    previous = high = low = 0.0
    filtered = []
    for sample in samples:
        high = high_alpha * (high + sample - previous)
        previous = sample
        low += low_alpha * (high - low)
        filtered.append(low)
    return filtered


def prepare(samples, spec, start):
    offset, count = round(start * RATE), round(spec["duration"] * RATE)
    cut = samples[offset:offset + count]
    assert len(cut) == count
    cut = filter_clip(cut, spec["highpass"], spec["lowpass"])
    rms = math.sqrt(sum(value * value for value in cut) / count)
    gain = min(spec["rms"] / max(rms, 1e-9), spec["peak"] / max(abs(v) for v in cut))
    # Short fades remove cut-edge clicks; pauses/aborts still stop immediately in the game.
    edge = round(.012 * RATE)
    output = array.array("h", (round(v * gain * min(1, i / edge, (count - 1 - i) / edge) * 32767)
                              for i, v in enumerate(cut)))
    if sys.byteorder != "little":
        output.byteswap()
    return output.tobytes()


for cue, spec in MANIFEST["clips"].items():
    samples = read_source(spec["source"])
    for variant, start in enumerate(spec["starts"]):
        with wave.open(str(ROOT / f"{cue}-{variant}.wav"), "wb") as output:
            output.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
            output.writeframes(prepare(samples, spec, start))
