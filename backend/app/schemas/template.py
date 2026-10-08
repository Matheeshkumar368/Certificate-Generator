from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class TemplateElement(BaseModel):
    id: str
    type: str  # text, image, logo, signature, shape, line
    x: float
    y: float
    width: float
    height: float
    rotation: Optional[float] = 0.0
    zIndex: Optional[int] = 1

    # Text specific
    text: Optional[str] = None
    fontFamily: Optional[str] = "Helvetica"
    fontSize: Optional[int] = 16
    fontWeight: Optional[str] = "normal"  # normal, bold
    fontStyle: Optional[str] = "normal"  # normal, italic
    color: Optional[str] = "#000000"
    alignment: Optional[str] = "center"  # left, center, right
    lineHeight: Optional[float] = 1.2

    # Shape specific
    shapeType: Optional[str] = "rectangle"  # rectangle, circle, line
    fillColor: Optional[str] = "#D97706"
    strokeColor: Optional[str] = "#B45309"
    strokeWidth: Optional[float] = 1.0

    # Image / Logo / Signature specific
    src: Optional[str] = None


class TemplateConfig(BaseModel):
    background: Optional[str] = "#FCFBF9"
    gradient: Optional[str] = None
    borderStyle: Optional[str] = "classic_gold"  # classic_gold, modern_minimal, corporate_blue, elegant_black, academic, creative_gradient, none
    elements: List[TemplateElement] = []


class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    category: str = Field(default="Corporate")
    orientation: str = Field(default="landscape")
    canvas_width: int = Field(default=800)
    canvas_height: int = Field(default=566)
    configuration: Dict[str, Any]


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    orientation: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    category: str
    orientation: str
    canvas_width: int
    canvas_height: int
    configuration: Dict[str, Any]
    is_system_template: bool
    created_at: datetime
    updated_at: datetime
