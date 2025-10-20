import React from 'react';
import { Sheet, SheetPortal, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export default function AdminInviteDetails({ invite, open, onClose }) {
  if (!invite) return null;

  const charityInfo = invite.onboarding_json?.charityInfo || {};

  // For overrides: check overrides_json first, fallback to onboarding_json.sectionOverrides
  const overrides = invite.overrides_json && Object.keys(invite.overrides_json).length > 0
    ? invite.overrides_json
    : invite.onboarding_json?.sectionOverrides || {};

  // For images: check images_json first, fallback to onboarding_json images
  const images = invite.images_json && Object.keys(invite.images_json).length > 0
    ? invite.images_json
    : invite.onboarding_json?.images || {};

  // Determine explicit section order (used to detect sections user actually added)
  const sectionOrder = (overrides && Array.isArray(overrides._sectionOrder))
    ? overrides._sectionOrder
    : (typeof overrides?._sectionOrder === 'object' && overrides?._sectionOrder != null)
      ? Object.values(overrides._sectionOrder)
      : [];

  // Debug logging to help troubleshoot data sources
  console.log('📊 Admin details data sources:', {
    hasOverridesJson: !!(invite.overrides_json && Object.keys(invite.overrides_json).length > 0),
    hasOnboardingSectionOverrides: !!(invite.onboarding_json?.sectionOverrides && Object.keys(invite.onboarding_json.sectionOverrides).length > 0),
    hasImagesJson: !!(invite.images_json && Object.keys(invite.images_json).length > 0),
    hasOnboardingImages: !!(invite.onboarding_json?.images && Object.keys(invite.onboarding_json.images).length > 0),
    usingOverrides: overrides === invite.overrides_json ? 'overrides_json' : 'onboarding_json.sectionOverrides',
    usingImages: images === invite.images_json ? 'images_json' : 'onboarding_json.images',
    sectionsFound: Object.keys(overrides),
    imagesFound: Object.keys(images)
  });

  // Use user-provided charity name from onboarding if available, otherwise fall back to production name
  const getCharityName = () => {
    return charityInfo.charityName || invite.charity_name;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const downloadImage = (imageUrl, filename) => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'invited': return 'invited';
      case 'in_progress': return 'in_progress';
      case 'submitted': return 'submitted';
      case 'handed_off': return 'handed_off';
      case 'void': return 'void';
      default: return 'default';
    }
  };

  const getVariantLabel = (variant) => {
    const labels = { A: 'Layout A', B: 'Layout B', C: 'Layout C' };
    return labels[variant] || variant;
  };

  const renderColorSwatch = (color) => {
    if (!color) return null;
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
        onClick={() => copyToClipboard(color, 'Color')}
      >
        <div
          className="w-4 h-4 rounded border"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-mono">{color}</span>
        <Copy className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  };

  const renderSectionAccordion = (sectionKey, sectionData) => {
    // Images are stored with IDs like "hero-image-1760553768983.jpeg" (with timestamps)
    // We need to find all images that belong to this section
    const sectionImages = {};

    // Convert section key to kebab-case for matching
    // e.g., "whoYouHelp" -> "who-you-help"
    const kebabSectionKey = sectionKey.replace(/([A-Z])/g, '-$1').toLowerCase();

    Object.entries(images).forEach(([imageId, imageUrl]) => {
      // Normalize imageId by removing timestamps and extensions for comparison
      const normalizedImageId = imageId.toLowerCase();

      // Check if the normalized imageId contains the kebab-case section key
      if (normalizedImageId.includes(kebabSectionKey) ||
        normalizedImageId.includes(sectionKey.toLowerCase()) ||
        // Specific section matches
        (sectionKey === 'hero' && normalizedImageId.startsWith('hero-image')) ||
        (sectionKey === 'feature' && normalizedImageId.startsWith('feature-image')) ||
        (sectionKey === 'extraPrizes' && normalizedImageId.includes('extra-prize')) ||
        (sectionKey === 'winners' && normalizedImageId.startsWith('winner')) ||
        (sectionKey === 'whoYouHelp' && normalizedImageId.includes('who-you-help'))) {
        sectionImages[imageId] = imageUrl;
      }
    });

    // Debug logging to help troubleshoot image matching
    if (Object.keys(images).length > 0) {
      console.log('📸 Images in invite:', Object.keys(images));
      console.log('🔍 Matching images for section:', sectionKey, '→', Object.keys(sectionImages));
    }

    return (
      <AccordionItem key={sectionKey} value={sectionKey}>
        <AccordionTrigger className="text-left">
          <div className="flex items-center gap-2">
            <span className="capitalize">{sectionKey.replace(/([A-Z])/g, ' $1').trim()}</span>
            {sectionData.visible === false && (
              <Badge variant="outline" className="text-xs">Hidden</Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableBody>
              {/* Layout */}
              <TableRow>
                <TableHead className="w-[160px]">Layout</TableHead>
                <TableCell>{getVariantLabel(sectionData.variant)}</TableCell>
              </TableRow>

              {/* Copy Fields */}
              {sectionData.copy && Object.entries(sectionData.copy)
                .filter(([key]) => !key.includes('action'))
                .map(([key, value]) => (
                  <TableRow
                    key={key}
                    className={value ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={value ? () => copyToClipboard(value, key.replace(/([A-Z])/g, ' $1').trim()) : undefined}
                  >
                    <TableHead className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </TableHead>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{value || 'Not set'}</span>
                        {value && <Copy className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {/* Button Links */}
              {sectionData.copy && Object.entries(sectionData.copy)
                .filter(([key]) => key.includes('action'))
                .map(([key, value]) => (
                  <TableRow key={key}>
                    <TableHead className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace('action', '').trim()} Link
                    </TableHead>
                    <TableCell className="break-all">{value || 'Not set'}</TableCell>
                  </TableRow>
                ))}

              {/* Display Settings */}
              {sectionData.display && Object.entries(sectionData.display).map(([key, value]) => (
                <TableRow key={key}>
                  <TableHead className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </TableHead>
                  <TableCell>
                    <Badge variant={value ? "submitted" : "void"} className="text-xs">
                      {value ? 'Visible' : 'Hidden'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {/* Theme Colors */}
              {sectionData.theme?.enabled && sectionData.theme?.values &&
                Object.entries(sectionData.theme.values).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableHead className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()} Color
                    </TableHead>
                    <TableCell>
                      {renderColorSwatch(value)}
                    </TableCell>
                  </TableRow>
                ))}

              {/* Images */}
              {Object.entries(sectionImages).map(([imageKey, imageUrl]) => (
                <TableRow key={imageKey}>
                  <TableHead className="capitalize">
                    {imageKey.replace(/([A-Z])/g, ' $1').trim()} Image
                  </TableHead>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={imageUrl}
                        alt={imageKey}
                        className="w-12 h-12 object-cover border rounded"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(imageUrl, `${sectionKey}-${imageKey}`)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetPortal>
        {/* Custom SheetContent without backdrop */}
        <SheetPrimitive.Content
          className={cn(
            "fixed z-50 gap-4 w-[620px] bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "inset-y-0 right-0 h-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          )}
          style={{ maxWidth: '620px', minWidth: '390px' }}
        >
          <div className="flex  justify-between">

            <SheetHeader>
              <SheetTitle className="text-xl mb-0">{getCharityName()}</SheetTitle>
              <p className="text-sm text-muted-foreground">{charityInfo.charitySite || 'Not provided'}</p>
            </SheetHeader>
            <SheetPrimitive.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          </div>

          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="py-6">
              <Accordion type="multiple" defaultValue={[]} className="space-y-2">
                {/* Invite Section */}
                <AccordionItem value="invite">
                  <AccordionTrigger>Invite</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableBody>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => copyToClipboard(charityInfo.submitterName || invite.contact_name, 'Contact Name')}
                        >
                          <TableHead className="w-[160px]">Contact Name</TableHead>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{charityInfo.submitterName || invite.contact_name}</span>
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => copyToClipboard(invite.contact_email, 'Contact Email')}
                        >
                          <TableHead>Contact Email</TableHead>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{invite.contact_email}</span>
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </TableCell>
                        </TableRow>
                        {/*<TableRow>
                      <TableHead>Invite Token</TableHead>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                            {invite.public_token}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(invite.public_token, 'Token')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>*/}
                        <TableRow>
                          <TableHead>Created</TableHead>
                          <TableCell>{formatDate(invite.created_at)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>Last Updated</TableHead>
                          <TableCell>{formatDate(invite.updated_at)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>

                {/* Charity Section */}
                <AccordionItem value="charity">
                  <AccordionTrigger>Logo</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableBody>

                        {charityInfo.charityLogo && (
                          <TableRow>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <img
                                  src={charityInfo.charityLogo}
                                  alt="Charity Logo"
                                  className="w-16 h-16 object-contain border rounded"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadImage(charityInfo.charityLogo, 'charity-logo')}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>

                {/* Campaign Section */}
                <AccordionItem value="campaign">
                  <AccordionTrigger>Campaign</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-[160px]">Status</TableHead>
                          <TableCell>
                            <Badge variant={getStatusVariant(invite.status)}>
                              {invite.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>Raffle Type</TableHead>
                          <TableCell>{charityInfo.raffleType || 'Not specified'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>Launch Date</TableHead>
                          <TableCell>{charityInfo.campaignLaunchDate || 'Not specified'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>

                {/* Ascend Representative Section */}
                <AccordionItem value="ascend">
                  <AccordionTrigger>Ascend Client Services Representative</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-[160px]">Name</TableHead>
                          <TableCell>{charityInfo.ascendRepresentative || 'Not specified'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableCell>{charityInfo.ascendEmail || 'Not specified'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>

                {/* Section Accordions */}
                {Object.entries(overrides)
                  .filter(([k]) => k !== '_sectionOrder')
                  .filter(([k, v]) => {
                    // Only include WhoYouHelp if it was explicitly added (in order) or explicitly visible
                    if (k === 'WhoYouHelp') {
                      const explicitlyAdded = Array.isArray(sectionOrder) && sectionOrder.includes('WhoYouHelp');
                      const explicitlyVisible = v && v.visible === true;
                      return explicitlyAdded || explicitlyVisible;
                    }
                    return true;
                  })
                  .map(([sectionKey, sectionData]) =>
                    renderSectionAccordion(sectionKey, sectionData)
                  )}

                {/* Footer Info (explicit) */}
                <AccordionItem value="footer-info">
                  <AccordionTrigger>Footer</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-[160px]">Charity Name</TableHead>
                          <TableCell>{charityInfo.charityName || 'Not provided'}</TableCell>
                        </TableRow>
                        {charityInfo.charityLogo && (
                          <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <img
                                  src={charityInfo.charityLogo}
                                  alt="Footer Logo"
                                  className="w-16 h-16 object-contain border rounded"
                                />
                                <Button size="sm" variant="outline" onClick={() => downloadImage(charityInfo.charityLogo, 'footer-logo')}>
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>

                {/* Global Theme */}
                {invite.theme_json && (
                  <AccordionItem value="theme">
                    <AccordionTrigger>Global Theme</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          {/* Colors */}
                          {invite.theme_json.colors && Object.entries(invite.theme_json.colors).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableHead className="capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()} Color
                              </TableHead>
                              <TableCell>
                                {renderColorSwatch(value)}
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Fonts */}
                          {invite.theme_json.fonts && Object.entries(invite.theme_json.fonts).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableHead className="capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()} Font
                              </TableHead>
                              <TableCell>{value || 'Default'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </ScrollArea>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
}
