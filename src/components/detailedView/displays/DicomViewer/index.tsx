import React from 'react'
import { useDispatch } from 'react-redux'
import * as dicomParser from 'dicom-parser'
import * as cornerstone from 'cornerstone-core'
import * as cornerstoneNIFTIImageLoader from 'cornerstone-nifti-image-loader'
import * as cornerstoneFileImageLoader from 'cornerstone-file-image-loader'
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader'
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import { Progress, ProgressSize } from '@patternfly/react-core'
import { useTypedSelector } from '../../../../store/hooks'
import {
  getDicomPatientName,
  getDicomStudyDate,
  getDicomStudyTime,
  getDicomStudyDescription,
  getDicomSeriesDate,
  getDicomSeriesTime,
  getDicomSeriesDescription,
  getDicomSeriesNumber,
  getDicomInstanceNumber,
  getDicomSliceDistance,
  getDicomEchoNumber,
  getDicomSliceLocation,
  getDicomColumns,
  getDicomRows,
  dicomDateTimeToLocale,
  isNifti,
  isDicom,
} from '../../../dicomViewer/utils'
import { setFilesForGallery } from '../../../../store/explorer/actions'
import { useHistory } from 'react-router'
import GalleryDicomView from '../../../dicomViewer/GalleryDicomView'

cornerstoneNIFTIImageLoader.external.cornerstone = cornerstone
cornerstoneFileImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.dicomParser = dicomParser
cornerstoneNIFTIImageLoader.nifti.configure({
  headers: {
    'Content-Type': 'application/vnd.collection+json',
    Authorization: 'Token ' + window.sessionStorage.getItem('CHRIS_TOKEN'),
  },
  method: 'get',
  responseType: 'arrayBuffer',
})
const ImageId = cornerstoneNIFTIImageLoader.nifti.ImageId

const DicomViewerContainer = () => {
  const history = useHistory()
  const files = useTypedSelector((state) => state.explorer.selectedFolder)
  const dispatch = useDispatch()

  const close = React.useCallback(() => {
    history.push('/gallery')
  }, [history])

  const loadImagesIntoCornerstone = React.useCallback(async () => {
    if (files) {
      let nifti = false

      const imageIds: string[] = []
      let niftiSlices = 0
      for (let i = 0; i < files.length; i++) {
        const selectedFile = files[i].file
        if (selectedFile) {
          if (isNifti(selectedFile.data.fname)) {
            nifti = true
            const fileArray = selectedFile.data.fname.split('/')
            const fileName = fileArray[fileArray.length - 1]
            const imageIdObject = ImageId.fromURL(
              `nifti:${selectedFile.url}${fileName}`,
            )

            niftiSlices = cornerstone.metaData.get(
              'multiFrameModule',
              imageIdObject.url,
            ).numberOfFrames

            imageIds.push(
              ...Array.from(
                Array(niftiSlices),
                (_, i) =>
                  `nifti:${imageIdObject.filePath}#${imageIdObject.slice.dimension}-${i},t-0`,
              ),
            )
          } else if (isDicom(selectedFile.data.fname)) {
            const file = await selectedFile.getFileBlob()
            imageIds.push(
              cornerstoneWADOImageLoader.wadouri.fileManager.add(file),
            )
          } else {
            const file = await selectedFile.getFileBlob()
            imageIds.push(cornerstoneFileImageLoader.fileManager.add(file))
          }
        }
      }
      dispatch(setFilesForGallery(imageIds))
    }
  }, [files, dispatch, close])

  React.useEffect(() => {
    loadImagesIntoCornerstone()
  }, [loadImagesIntoCornerstone])

  return <GalleryDicomView />
}

export default DicomViewerContainer
