import path from "path"

import cleanup from "../utils/cleanup"
import measurePDF from "../utils/measurePDF"
import getResolutions from "../utils/getResolutions"
import postPingback from "../utils/postPingback"
import gs from "../gs"
import { Task } from "./"
import uploadToS3 from "../utils/uploadToS3"

export default async (task: Task): Promise<void> => {
  const { pingback, filename, inputFilePath, outputDir, outFileType } = task

  try {
    postPingback(pingback, {
      status: "processing",
      message: "Converting file",
      forwardData: task.forwardData,
    })

    const measurements: number[][] = await measurePDF(inputFilePath)
    const outputResolutions: number[] = getResolutions(measurements)
    const outputFilePath = path.join(outputDir, "page")

    await Promise.all(
      outputResolutions.map((resolution, i) => {
        return gs.convert(
          inputFilePath,
          outputFilePath,
          outFileType,
          resolution,
          i + 1
        )
      })
    )

    postPingback(pingback, {
      status: "processing",
      message: "Uploading to S3",
      forwardData: task.forwardData,
    })

    // Disable uploading and posting in testing
    if (process.env.NODE_ENV !== "production" && process.env.LOCAL) {
      console.log("\x1b[33m%s\x1b[0m", "* Converted files not uploaded *", "\n")
      postPingback(pingback, {
        status: "end",
        message: {
          s3Dir: "s3-directory-abcde",
          files: ["sample-file1.png", "sample-file2.png"],
        },
        forwardData: task.forwardData,
      })
    } else {
      const files = await uploadToS3(outputDir, filename, outFileType)
      postPingback(pingback, {
        status: "end",
        message: { s3Dir: filename, files },
        forwardData: task.forwardData,
      })
    }

    cleanup(inputFilePath, outputDir)
  } catch (e) {
    console.log(`Error with task ${task}`)
    console.log(e.stack)
  }
}
