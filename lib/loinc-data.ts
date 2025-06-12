import { LoincCode } from './types'

export const sampleLoincCodes: LoincCode[] = [
  {
    code: "2339-0",
    displayName: "Glucose [Mass/volume] in Blood",
    longCommonName: "Glucose [Mass/volume] in Blood",
    shortName: "Glucose SerPl-mCnc",
    component: "Glucose",
    property: "MCnc",
    timeAspect: "Pt",
    system: "Ser/Plas",
    scaleType: "Qn",
    methodType: "",
    className: "CHEM",
    versionLastChanged: "2.73"
  },
  {
    code: "2093-3",
    displayName: "Cholesterol [Mass/volume] in Serum or Plasma",
    longCommonName: "Cholesterol [Mass/volume] in Serum or Plasma",
    shortName: "Cholesterol SerPl-mCnc",
    component: "Cholesterol",
    property: "MCnc",
    timeAspect: "Pt",
    system: "Ser/Plas",
    scaleType: "Qn",
    methodType: "",
    className: "CHEM",
    versionLastChanged: "2.73"
  },
  {
    code: "789-8",
    displayName: "Erythrocytes [#/volume] in Blood by Automated count",
    longCommonName: "Erythrocytes [#/volume] in Blood by Automated count",
    shortName: "RBC # Bld Auto",
    component: "Erythrocytes",
    property: "NCnc",
    timeAspect: "Pt",
    system: "Bld",
    scaleType: "Qn",
    methodType: "Automated count",
    className: "HEM/BC",
    versionLastChanged: "2.73"
  },
  {
    code: "6298-4",
    displayName: "Potassium [Moles/volume] in Blood",
    longCommonName: "Potassium [Moles/volume] in Blood",
    shortName: "Potassium Bld-sCnc",
    component: "Potassium",
    property: "SCnc",
    timeAspect: "Pt",
    system: "Bld",
    scaleType: "Qn",
    methodType: "",
    className: "CHEM",
    versionLastChanged: "2.73"
  },
  {
    code: "718-7",
    displayName: "Hemoglobin [Mass/volume] in Blood",
    longCommonName: "Hemoglobin [Mass/volume] in Blood",
    shortName: "Hemoglobin Bld-mCnc",
    component: "Hemoglobin",
    property: "MCnc",
    timeAspect: "Pt",
    system: "Bld",
    scaleType: "Qn",
    methodType: "",
    className: "HEM/BC",
    versionLastChanged: "2.73"
  },
  {
    code: "4548-4",
    displayName: "Hemoglobin A1c/Hemoglobin.total in Blood",
    longCommonName: "Hemoglobin A1c/Hemoglobin.total in Blood",
    shortName: "Hemoglobin A1c/Hemoglobin.total Bld-mFr",
    component: "Hemoglobin A1c/Hemoglobin.total",
    property: "MFr",
    timeAspect: "Pt",
    system: "Bld",
    scaleType: "Qn",
    methodType: "",
    className: "CHEM",
    versionLastChanged: "2.73"
  },
  {
    code: "33743-4",
    displayName: "Thyroid stimulating hormone [Units/volume] in Serum or Plasma",
    longCommonName: "Thyroid stimulating hormone [Units/volume] in Serum or Plasma",
    shortName: "TSH SerPl-cCnc",
    component: "Thyroid stimulating hormone",
    property: "CCnc",
    timeAspect: "Pt",
    system: "Ser/Plas",
    scaleType: "Qn",
    methodType: "",
    className: "CHEM",
    versionLastChanged: "2.73"
  },
  {
    code: "2951-2",
    displayName: "Sodium [Moles/volume] in Serum or Plasma",
    longCommonName: "Sodium [Moles/volume] in Serum or Plasma",
    shortName: "Sodium SerPl-sCnc",
    component: "Sodium",
    property: "SCnc",
    timeAspect: "Pt",
    system: "Ser/Plas",
    scaleType: "Qn",
    methodType: "",
    className: "CHEM",
    versionLastChanged: "2.73"
  },
  {
    code: "777-3",
    displayName: "Platelets [#/volume] in Blood by Automated count",
    longCommonName: "Platelets [#/volume] in Blood by Automated count",
    shortName: "Platelets # Bld Auto",
    component: "Platelets",
    property: "NCnc",
    timeAspect: "Pt",
    system: "Bld",
    scaleType: "Qn",
    methodType: "Automated count",
    className: "HEM/BC",
    versionLastChanged: "2.73"
  },
  {
    code: "6690-2",
    displayName: "Leukocytes [#/volume] in Blood by Automated count",
    longCommonName: "Leukocytes [#/volume] in Blood by Automated count",
    shortName: "WBC # Bld Auto",
    component: "Leukocytes",
    property: "NCnc",
    timeAspect: "Pt",
    system: "Bld",
    scaleType: "Qn",
    methodType: "Automated count",
    className: "HEM/BC",
    versionLastChanged: "2.73"
  }
]

export function createSearchableText(code: LoincCode): string {
  return [
    code.displayName,
    code.longCommonName,
    code.shortName,
    code.component,
    code.system,
    code.property,
    code.className
  ].join(' ').toLowerCase()
}