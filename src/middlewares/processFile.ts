import { Protocol, Response } from "restana"
import { ExtendedRequest } from "../types"
import fs from "fs"
import path from "path"
import pdf2cairo from "../pdf2cairo"
import { nanoid } from "nanoid"

export default (
  req: ExtendedRequest,
  res: Response<Protocol.HTTPS>,
  next: () => void
): void => {
  console.log("starting to process")
  const filename = nanoid()
  const tempDir = path.join(__dirname, "../../tmp/")
  const cairoOutputDir = path.join(tempDir, "cairo", filename)

  if (!fs.existsSync(cairoOutputDir)) {
    console.log(`creating ${cairoOutputDir}`)
    fs.mkdirSync(cairoOutputDir, { recursive: true })
  }

  const saveToPath = path.join(tempDir, `${filename}.pdf`)
  console.log(`streaming to ${saveToPath}`)
  req.pipe(fs.createWriteStream(saveToPath))

  req.on("end", async () => {
    console.log("req on end")
    req.locals = {
      cairoDir: cairoOutputDir,
      s3Dir: filename,
    }

    await pdf2cairo.convert(
      saveToPath,
      path.join(cairoOutputDir, "page"),
      req.outFileType
    )

    console.log("file processed")
    next()
  })

  req.on("error", (e: Error) => {
    throw e
  })
}
