import { Protocol, Response } from "restana"
import url from "url"

import { ExtendedRequest } from "../types"

export default (
  req: ExtendedRequest,
  res: Response<Protocol.HTTPS>,
  next: () => void
): void => {
  const qs = url.parse(req.url, true).query

  if (Array.isArray(qs.out) || Array.isArray(qs.download)) {
    throw new Error(
      "Conveyor only accepts one 'out' querystring parameter and one 'download' querystring parameter"
    )
  }

  let outFileType: string
  if (!qs.out) {
    outFileType = "png"
  } else if (/^jpe?g$/i.test(qs.out)) {
    outFileType = "jpeg"
  } else if (/^tiff?$/i.test(qs.out)) {
    outFileType = "tif"
  } else {
    outFileType = qs.out.toLowerCase()
  }

  req.outFileType = outFileType
  req.clientDownload = qs.download?.toLowerCase() === "true" ? true : false

  next()
}
