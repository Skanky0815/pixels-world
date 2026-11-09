"""Original deterministic PCM effects for Pixel's World. CC0-1.0; no recordings."""
import math
import random
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "assets/audio"
RATE = 22050


def render(kind, variant):
    rng = random.Random(237 + variant)
    duration = {"vase": .48, "picture": .38, "books": .24,
                "creak": .32, "collapse": .65}[kind]
    samples = []
    for i in range(int(RATE * duration)):
        t = i / RATE
        noise = rng.uniform(-1, 1)
        pitch = 1 + variant * .07
        if kind in ("vase", "picture"):
            frequencies = (1370, 2130, 3310) if kind == "vase" else (940, 1620, 2570)
            value = sum(math.sin(t * math.tau * f * pitch) for f in frequencies) / 5
            value += noise * .45
            value *= math.exp(-t * 13)
        elif kind == "books":
            value = (math.sin(t * math.tau * 105 * pitch) + noise * .3) * math.exp(-t * 25) * .6
        elif kind == "creak":
            value = math.sin(t * math.tau * (230 * pitch + 45 * math.sin(t * 23)))
            value = (value * .4 + noise * .12) * math.sin(math.pi * t / duration) ** 2
        else:
            pulse = max(0, t - .12)
            value = (noise * .65 + math.sin(t * math.tau * 75 * pitch) * .3) * math.exp(-t * 7)
            value += noise * .2 * math.exp(-pulse * 22) * (t > .12)
        envelope = min(1, t * 1000) * min(1, (duration - t) * 500)
        samples.append(struct.pack("<h", int(max(-1, min(1, value * envelope * .7)) * 32767)))
    with wave.open(str(ROOT / f"{kind}-{variant}.wav"), "wb") as output:
        output.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        output.writeframes(b"".join(samples))


for cue in ("vase", "picture", "books", "creak", "collapse"):
    for variation in range(2):
        render(cue, variation)
