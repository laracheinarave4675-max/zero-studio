import json
import tempfile
import unittest
import zipfile
from pathlib import Path

import cv2
import numpy as np

from package_motion_reference import package_video


class MotionReferencePackageTests(unittest.TestCase):
    def test_extracts_native_frames_and_builds_review_package(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "source.mp4"
            writer = cv2.VideoWriter(str(source), cv2.VideoWriter_fourcc(*"mp4v"), 12, (96, 64))
            self.assertTrue(writer.isOpened())
            for index in range(7):
                frame = np.zeros((64, 96, 3), dtype=np.uint8)
                cv2.circle(frame, (12 + index * 10, 32), 8, (255, 255, 255), -1)
                writer.write(frame)
            writer.release()

            output = root / "package"
            result = package_video(
                source, output,
                reference_asset_id="character-asset-01",
                driving_video_id="drive-clip-01",
                model_id="One-to-All 1.3B v2",
                checkpoint_id="checkpoint-test",
            )
            self.assertEqual(result["frame_count"], 7)
            self.assertEqual(result["native_fps"], 12)
            manifest = json.loads((output / "motion_manifest.json").read_text())
            self.assertEqual(manifest["role"], "motion-reference-not-final-art")
            self.assertEqual(manifest["generated_video"]["frame_count"], 7)
            self.assertEqual(len(manifest["frames"]), 7)
            self.assertEqual(manifest["frames"][6]["timestamp_seconds"], 0.5)
            self.assertTrue((output / "contact_sheet.png").is_file())
            self.assertEqual(len(list((output / "frames").glob("*.png"))), 7)
            with zipfile.ZipFile(output / "motion-reference-frames.zip") as archive:
                names = archive.namelist()
            self.assertEqual(len(names), 9)
            self.assertIn("motion_manifest.json", names)
            self.assertIn("contact_sheet.png", names)

    def test_refuses_to_overwrite_nonempty_output_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "source.mp4"
            writer = cv2.VideoWriter(str(source), cv2.VideoWriter_fourcc(*"mp4v"), 12, (96, 64))
            writer.write(np.zeros((64, 96, 3), dtype=np.uint8))
            writer.release()
            output = root / "output"
            output.mkdir()
            (output / "keep.txt").write_text("keep")
            with self.assertRaises(FileExistsError):
                package_video(
                    source, output,
                    reference_asset_id="", driving_video_id="",
                    model_id="test", checkpoint_id="test",
                )


if __name__ == "__main__":
    unittest.main()
