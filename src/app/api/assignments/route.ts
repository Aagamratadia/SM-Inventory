import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';
import mongoose from 'mongoose';

// GET /api/assignments
// Query params: itemName, category, userId, performedBy, action, dateFrom, dateTo
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const itemName = searchParams.get('itemName') || undefined;
    const category = searchParams.get('category') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const performedBy = searchParams.get('performedBy') || undefined;
    const action = searchParams.get('action') || undefined; // 'assigned' | 'returned'
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const matchStages: any[] = [];
    if (itemName) matchStages.push({ name: { $regex: itemName, $options: 'i' } });
    if (category) matchStages.push({ category: { $regex: category, $options: 'i' } });

    const pipeline: any[] = [];
    if (matchStages.length) pipeline.push({ $match: { $and: matchStages } });

    pipeline.push({ $unwind: '$assignmentHistory' });

    const histMatch: any = {};
    if (action) histMatch['assignmentHistory.action'] = action;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) histMatch['assignmentHistory.user'] = new mongoose.Types.ObjectId(userId);
    if (performedBy && mongoose.Types.ObjectId.isValid(performedBy)) histMatch['assignmentHistory.performedBy'] = new mongoose.Types.ObjectId(performedBy);

    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) {
        // include the whole day for dateTo
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      // use assignedAt for 'assigned' and returnedAt for 'returned'. If not specified, match either
      if (action === 'assigned') {
        histMatch['assignmentHistory.assignedAt'] = dateFilter;
      } else if (action === 'returned') {
        histMatch['assignmentHistory.returnedAt'] = dateFilter;
      } else {
        // generic OR on both fields
        histMatch.$or = [
          { 'assignmentHistory.assignedAt': dateFilter },
          { 'assignmentHistory.returnedAt': dateFilter },
        ];
      }
    }

    if (Object.keys(histMatch).length) pipeline.push({ $match: histMatch });

    pipeline.push(
      // Look up referenced users
      {
        $lookup: {
          from: 'users',
          localField: 'assignmentHistory.user',
          foreignField: '_id',
          as: 'assignedUser',
        },
      },
      { $unwind: { path: '$assignedUser', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'assignmentHistory.performedBy',
          foreignField: '_id',
          as: 'actor',
        },
      },
      { $unwind: { path: '$actor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          itemId: '$_id',
          itemName: '$name',
          category: 1,
          vendorname: 1,
          action: '$assignmentHistory.action',
          quantity: '$assignmentHistory.quantity',
          assignedAt: '$assignmentHistory.assignedAt',
          returnedAt: '$assignmentHistory.returnedAt',
          user: { _id: '$assignedUser._id', name: '$assignedUser.name' },
          performedBy: { _id: '$actor._id', name: '$actor.name' },
        },
      },
      { $sort: { assignedAt: -1, returnedAt: -1 } }
    );

    const results = await Item.aggregate(pipeline);
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error fetching assignment history:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
