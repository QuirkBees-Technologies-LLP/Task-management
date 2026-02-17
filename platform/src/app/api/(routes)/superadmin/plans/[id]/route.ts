import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME } from '../../../../config';
import { verifySystemAdmin } from '../../../../helpers';
import { stripe } from '@/utils/stripe';
import { ObjectId } from 'mongodb';

// GET /api/superadmin/plans/:id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    const plan = await plansCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!plan) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        plan: {
          ...plan,
          _id: plan._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ message: 'Failed to fetch plan' }, { status: 500 });
  }
}

// PATCH /api/superadmin/plans/:id
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
    }

    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Fetch existing plan to preserve values when partially updating
    const existingPlan = await plansCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!existingPlan) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.plan_name !== undefined) {
      updateData.plan_name = body.plan_name;
    }
    if (body.description !== undefined) {
      updateData.description = body.description || '';
    }
    if (body.plan_type !== undefined) {
      updateData.plan_type = Array.isArray(body.plan_type) ? body.plan_type : [];
    }
    if (body.trial_type !== undefined) {
      updateData.trial_type = Array.isArray(body.trial_type) ? body.trial_type : [];
    }

    // Determine effective billing period for price rules (values are lower-case)
    let processedBillingPeriod = body.billing_period;
    if (typeof processedBillingPeriod === 'string') {
        if (processedBillingPeriod === 'both') {
            processedBillingPeriod = ['monthly', 'yearly'];
        } else {
            processedBillingPeriod = [processedBillingPeriod];
        }
    }

    const newBillingPeriod =
      processedBillingPeriod !== undefined
        ? Array.isArray(processedBillingPeriod)
          ? processedBillingPeriod
          : []
        : existingPlan.billing_period || [];
    const hasMonthly = newBillingPeriod.includes('monthly');
    const hasYearly = newBillingPeriod.includes('yearly');

    if (body.price !== undefined) {
      if (typeof body.price === 'object' && !Array.isArray(body.price)) {
        // Preserve existing price values and only update provided fields,
        // but also respect the effective billing period
        const existingPrice = existingPlan.price || { monthly: null, yearly: null };
        updateData.price = {
          monthly: hasMonthly
            ? body.price.monthly !== undefined
              ? body.price.monthly !== null && body.price.monthly !== ''
                ? Number(body.price.monthly)
                : null
              : existingPrice.monthly
            : null, // If Monthly is not enabled, force null
          yearly: hasYearly
            ? body.price.yearly !== undefined
              ? body.price.yearly !== null && body.price.yearly !== ''
                ? Number(body.price.yearly)
                : null
              : existingPrice.yearly
            : null, // If Yearly is not enabled, force null
        };
      }
    }

    if (body.billing_period !== undefined) {
      updateData.billing_period = newBillingPeriod;
    }
    if (body.users_allowed !== undefined) {
      updateData.users_allowed = body.users_allowed !== null ? Number(body.users_allowed) : null;
    }
    if (body.organizations_allowed !== undefined) {
      updateData.organizations_allowed = body.organizations_allowed !== null ? Number(body.organizations_allowed) : null;
    }
    if (body.best_for !== undefined) {
      updateData.best_for = body.best_for || '';
    }
    if (body.access_level !== undefined) {
      updateData.access_level = Array.isArray(body.access_level) ? body.access_level : [];
    }
    if (body.features !== undefined) {
      updateData.features = Array.isArray(body.features) ? body.features : [];
    }
    if (body.mark_as_popular !== undefined) {
      updateData.mark_as_popular = Boolean(body.mark_as_popular);
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const result = await plansCollection.updateOne(
      { _id: new ObjectId(id), deletedAt: null },
      { $set: updateData }
    );

    // Sync with Stripe
    if (stripe && existingPlan.stripe_product_id) {
      try {
        // 1. Update Product details if name/description/features changed
        if (body.plan_name !== undefined || body.description !== undefined || body.features !== undefined) {
          const updateParams: any = {};
          if (body.plan_name) updateParams.name = body.plan_name;
          if (body.description !== undefined) updateParams.description = body.description;
          
          // Update metadata if features changed
          if (body.features !== undefined) {
             updateParams.metadata = {
                 features: Array.isArray(body.features) ? body.features.join(',').substring(0, 500) : '',
             };
          }

          await stripe.products.update(existingPlan.stripe_product_id, updateParams);
        }

        // 2. Handle Price Changes & Archival
        // Prices are immutable in Stripe. We must create NEW prices if the amount changes.
        // We only modify the DB 'stripe_price_ids' map.
        
        const stripeUpdates: any = {};
        let priceChanged = false;

        // Helper to safely manage prices (Reuse > Create > Archive Others)
        const manageStripePrice = async (
            productId: string, 
            interval: 'month' | 'year', 
            amount: number | null
        ): Promise<string | null> => {
            try {
                console.log(`[Stripe Manage] Checking ${interval} prices for product ${productId}. Target Amount: ${amount}`);
                
                // 1. List all active prices
                const prices = await stripe.prices.list({
                    product: productId,
                    active: true,
                    limit: 100,
                });

                let finalPriceId: string | null = null;
                let pricesToArchive = prices.data.filter(p => p.recurring?.interval === interval);

                // 2. If we need a valid price (enabled)
                if (amount !== null && amount !== undefined) {
                    const targetAmountCents = Math.round(Number(amount) * 100);
                    
                    // Check for exact match (Amount + Currency)
                    const existingMatch = pricesToArchive.find(p => 
                        p.unit_amount === targetAmountCents && 
                        p.currency === 'usd'
                    );

                    if (existingMatch) {
                        console.log(`[Stripe Manage] Found existing active price ${existingMatch.id}. Reusing.`);
                        finalPriceId = existingMatch.id;
                        // Remove from archive list
                        pricesToArchive = pricesToArchive.filter(p => p.id !== existingMatch.id);
                    } else {
                        console.log(`[Stripe Manage] No match found. Creating new price for ${amount}.`);
                        const newPrice = await stripe.prices.create({
                            product: productId,
                            unit_amount: targetAmountCents,
                            currency: 'usd',
                            recurring: { interval },
                            metadata: { plan_type: interval }
                        });
                        finalPriceId = newPrice.id;
                    }
                }

                // 3. Archive obsolete prices (All if amount is null, or conflicts if new created/reused)
                if (pricesToArchive.length > 0) {
                    console.log(`[Stripe Manage] Archiving ${pricesToArchive.length} obsolete ${interval} prices...`);
                    await Promise.all(pricesToArchive.map(p => 
                        stripe.prices.update(p.id, { active: false })
                    ));
                }

                return finalPriceId;

            } catch (err) {
                console.error(`[Stripe Manage] Error handling ${interval} price:`, err);
                return null;
            }
        };

        const effectiveBillingPeriod = updateData.billing_period || existingPlan.billing_period || [];
        const isMonthlyEnabled = effectiveBillingPeriod.includes('monthly');
        const isYearlyEnabled = effectiveBillingPeriod.includes('yearly');
        
        console.log(`[Plan Update] ID: ${id}, Monthly: ${isMonthlyEnabled}, Yearly: ${isYearlyEnabled}`);

        // Resolve target prices
        const targetMonthlyPrice = updateData.price?.monthly !== undefined 
            ? updateData.price.monthly 
            : existingPlan.price?.monthly;
            
        const targetYearlyPrice = updateData.price?.yearly !== undefined 
            ? updateData.price.yearly 
            : existingPlan.price?.yearly;

        // Check Monthly
        if (isMonthlyEnabled) {
            // Only update if price changed OR specifically enabled (to ensure sync)
            if (
                (updateData.price?.monthly !== undefined && updateData.price.monthly !== existingPlan.price?.monthly) ||
                !existingPlan.stripe_price_ids?.monthly // or if missing from DB
            ) {
                 const newId = await manageStripePrice(existingPlan.stripe_product_id, 'month', targetMonthlyPrice);
                 if (newId) {
                     stripeUpdates['stripe_price_ids.monthly'] = newId;
                     priceChanged = true;
                 }
            }
        } else {
            // Disabled - Ensure cleanup
            await manageStripePrice(existingPlan.stripe_product_id, 'month', null);
            stripeUpdates['stripe_price_ids.monthly'] = null;
            priceChanged = true;
        }

        // Check Yearly
         if (isYearlyEnabled) {
            // Only update if price changed OR specifically enabled
            if (
                (updateData.price?.yearly !== undefined && updateData.price.yearly !== existingPlan.price?.yearly) ||
                !existingPlan.stripe_price_ids?.yearly // or if missing from DB
            ) {
                 const newId = await manageStripePrice(existingPlan.stripe_product_id, 'year', targetYearlyPrice);
                 if (newId) {
                     stripeUpdates['stripe_price_ids.yearly'] = newId;
                     priceChanged = true;
                 }
            }
        } else {
            // Disabled - Ensure cleanup
            await manageStripePrice(existingPlan.stripe_product_id, 'year', null);
            stripeUpdates['stripe_price_ids.yearly'] = null;
            priceChanged = true;
        }

        // Check Yearly Price Change
         if (
            updateData.price?.yearly !== undefined && 
            updateData.price.yearly !== existingPlan.price?.yearly &&
            updateData.price.yearly !== null
        ) {
             const newYearlyPrice = await stripe.prices.create({
                product: existingPlan.stripe_product_id,
                unit_amount: Math.round(Number(updateData.price.yearly) * 100),
                currency: 'usd',
                recurring: { interval: 'year' },
                metadata: { plan_type: 'yearly' }
             });
             stripeUpdates['stripe_price_ids.yearly'] = newYearlyPrice.id;
             priceChanged = true;

             // Archive old price if exists
             if (existingPlan.stripe_price_ids?.yearly) {
                 try { await stripe.prices.update(existingPlan.stripe_price_ids.yearly, { active: false }); } catch(e) {}
             }
        }

        if (priceChanged) {
             await plansCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: stripeUpdates }
             );
        }

      } catch (stripeError) {
        console.error('Error syncing with Stripe:', stripeError);
        // Non-blocking error for now, but should ideally alert admin
      }
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    const updatedPlan = await plansCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      {
        success: true,
        plan: {
          ...updatedPlan,
          _id: updatedPlan!._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ message: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE /api/superadmin/plans/:id (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const systemAdminCheck = await verifySystemAdmin(request);
  if (systemAdminCheck.error) {
    return NextResponse.json({ error: systemAdminCheck.error }, { status: systemAdminCheck.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const plansCollection = db.collection('plans');

    // Archive on Stripe
    if (stripe) {
        try {
            const planToDelete = await plansCollection.findOne({ _id: new ObjectId(id) });
            
            if (planToDelete && planToDelete.stripe_product_id) {
                // Archive Product
                await stripe.products.update(planToDelete.stripe_product_id, { active: false });

                // Archive Prices
                if (planToDelete.stripe_price_ids) {
                    if (planToDelete.stripe_price_ids.monthly) {
                         try { await stripe.prices.update(planToDelete.stripe_price_ids.monthly, { active: false }); } catch(e) {}
                    }
                    if (planToDelete.stripe_price_ids.yearly) {
                         try { await stripe.prices.update(planToDelete.stripe_price_ids.yearly, { active: false }); } catch(e) {}
                    }
                }
            }
        } catch (stripeError) {
            console.error('Error archiving Stripe product:', stripeError);
            // We continue to delete from DB even if Stripe fails
        }
    }

    const result = await plansCollection.updateOne(
      { _id: new ObjectId(id), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Plan deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ message: 'Failed to delete plan' }, { status: 500 });
  }
}


