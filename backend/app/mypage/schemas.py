from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MyReportSummary(BaseModel):
    report_id: int
    created_at: datetime = Field(..., alias='created_at')
    final_risk: Optional[str] = Field(None, alias='final_risk')
    ad8_risk: Optional[str] = Field(None, alias='ad8_risk')
    chat_risk: Optional[str] = Field(None, alias='chat_risk')
    drawing_risk: Optional[str] = Field(None, alias='drawing_risk')

    class Config:
        orm_mode = True
        from_attributes = True # orm_mode is deprecated
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.strftime('%Y-%m-%d')
        }
