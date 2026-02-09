from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from core.database import db

router = APIRouter(prefix="/e-store", tags=["E-Store"])

class ProductCreate(BaseModel):
    school_id: str
    name: str
    price: float
    category: str
    description: Optional[str] = None
    stock: int = 0
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

@router.get("/products")
async def get_products(school_id: str, category: Optional[str] = None, search: Optional[str] = None):
    query = {"school_id": school_id}
    if category and category != "all":
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    products = await db.store_products.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    stats = {
        "total": len(products),
        "active": sum(1 for p in products if p.get("stock", 0) > 0),
        "out_of_stock": sum(1 for p in products if p.get("stock", 0) == 0)
    }
    return {"products": products, "stats": stats}

@router.post("/products")
async def create_product(data: ProductCreate):
    product = {
        "id": str(uuid.uuid4()),
        "school_id": data.school_id,
        "name": data.name,
        "price": data.price,
        "category": data.category,
        "description": data.description or "",
        "stock": data.stock,
        "image_url": data.image_url,
        "status": "active" if data.stock > 0 else "out_of_stock",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.store_products.insert_one(product)
    product.pop("_id", None)
    return {"success": True, "message": "Product added", "product": product}

@router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductUpdate):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    if "stock" in update_data:
        update_data["status"] = "active" if update_data["stock"] > 0 else "out_of_stock"

    result = await db.store_products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "message": "Product updated"}

@router.delete("/products/{product_id}")
async def delete_product(product_id: str, school_id: str):
    result = await db.store_products.delete_one({"id": product_id, "school_id": school_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "message": "Product deleted"}
