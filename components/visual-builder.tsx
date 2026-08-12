import { useEffect, useMemo, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { motion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, CommandIcon, Copy, Eye, LayoutPanelTop, LockKeyhole, Monitor, MoreHorizontal, MousePointer2, Plus, Smartphone, Tablet, Trash2, WandSparkles, Tag, LayoutTemplate, Pencil, Redo2, Undo2 } from "lucide-react";
import { BLOCK_CATEGORIES, BLOCK_VARIANTS_MAP } from "./builder-data";
import { isPremiumAcademyVariant } from "./premium-academy-blocks";
import { isPremiumSiteModuleVariant } from "./premium-site-modules";
import { BuilderRenderer } from "./builder-renderer";
import type { BlockCSSStyles, WebBlock } from "./builder-types";
import { BuilderStyleInspector } from "./builder-style-inspector";
import { BuilderTreeNavigator } from "./builder-tree-navigator";
import { supabase } from "@/lib/supabase";
import { fetchProducts } from "@/lib/ecom-queries";
import type { SiteRecord } from "./ui/onboarding-wizard";
import { getSiteKit } from "./site-kits";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import type { Viewport, Page } from "./builder-types";
import { variantStylePatches, createBlock, createGlobalHeader, createGlobalFooter, ensureStructuredContent, fromRow, fromThemeBlock } from "./builder-helpers";
import { PageManagerModal, SiteKitsModal, Field, ActionPanel, LeadRoutingPanel, BuilderDataConnections, BlockContentEditor, VariantPicker } from "./builder-panels";
import { SITE_DNA_PRESETS, applyDNAToBlocks, type SiteDNA } from "./site-dna";

export function VisualBuilder({
  site,
  onUpdateSite,
  onNavigateModule,
  onExit,
}: {
  site: SiteRecord;
  onUpdateSite?: (site: SiteRecord) => void;
  onNavigateModule?: (moduleId: string) => void;
  onExit: () => void;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const {
    state: blocks,
    setState: setBlocks,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetBlocks,
  } = useUndoRedo<WebBlock[]>([], { maxHistory: 60 });
  const [globalHeader, setGlobalHeader] = useState<WebBlock | null>(null);
  const [globalFooter, setGlobalFooter] = useState<WebBlock | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSubElement, setSelectedSubElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "design" | "effects">("content");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ecomProducts, setEcomProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [pageManagerOpen, setPageManagerOpen] = useState(false);
  const [siteKitsOpen, setSiteKitsOpen] = useState(false);
  const [applyingKitId, setApplyingKitId] = useState<string | null>(null);
  const [newPageName, setNewPageName] = useState("");
  const [editorNotice, setEditorNotice] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const pageSwitchingRef = useRef(false);
  const suppressPageAutosaveRef = useRef(false);

  const notify = (
    message: string,
    tone: "success" | "error" | "info" = "success",
  ) => {
    setEditorNotice({ message, tone });
    window.setTimeout(() => setEditorNotice(null), 4200);
  };

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    fetchProducts(site.id)
      .then((products) => {
        if (cancelled) return;
        setEcomProducts(
          products.map((product: any) => ({
            id: product.id,
            title: product.title,
            description: product.description,
            price: String(product.price),
            compare_at: product.compare_at_price
              ? String(product.compare_at_price)
              : "",
            stock: product.stock,
            category: product.category || "General",
            tags: product.tags || [],
            offer_badge: product.offer_badge || "",
            status:
              product.status === "active"
                ? "Active"
                : product.status === "draft"
                  ? "Draft"
                  : product.status || "Active",
            image: product.images?.[0]?.url || "",
          })),
        );
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [site.id]);

  const activeProducts = ecomProducts.filter(
    (product) => String(product.status).toLowerCase() === "active",
  );

  const selected =
    [globalHeader, ...blocks, globalFooter].find(
      (block) => block?.id === selectedId,
    ) || null;
  const activePage = pages.find((page) => page.id === activePageId) || null;
  const pageBlocks = blocks.filter(
    (block) => block.type !== "Navigation" && block.type !== "Footer",
  );
  const renderedBlocks = [
    ...(globalHeader ? [globalHeader] : []),
    ...pageBlocks,
    ...(globalFooter ? [globalFooter] : []),
  ];
  const isGlobalSelected =
    selected?.id === globalHeader?.id || selected?.id === globalFooter?.id;

  useEffect(() => {
    const load = async () => {
      setLoaded(false);
      const { data: pageRows } = await supabase
        .from("pages")
        .select("id, name, slug, seo_title, seo_desc, position")
        .eq("site_id", site.id)
        .order("position");
      let nextPages = (pageRows || []) as Page[];
      if (nextPages.length === 0) {
        const { data: created } = await supabase
          .from("pages")
          .insert({
            site_id: site.id,
            name: "Home",
            slug: "home",
            position: 0,
            seo_title: site.business_name,
            seo_desc: `Welcome to ${site.business_name}.`,
          })
          .select("id, name, slug, seo_title, seo_desc, position")
          .single();
        if (created) nextPages = [created as Page];
      }
      setPages(nextPages);
      const page = nextPages[0];
      if (!page) {
        setLoaded(true);
        return;
      }
      suppressPageAutosaveRef.current = true;
      setActivePageId(page.id);
      const { data: blockRows, error: blocksError } = await supabase
        .from("blocks")
        .select("*")
        .eq("page_id", page.id)
        .order("position");
      if (blocksError) {
        notify(`Could not load the first page: ${blocksError.message}`, "error");
        setLoaded(true);
        suppressPageAutosaveRef.current = false;
        return;
      }
      const loadedBlocks = (blockRows || []).map(fromRow);
      const legacyHeader =
        loadedBlocks.find((block) => block.type === "Navigation") || null;
      const legacyFooter =
        loadedBlocks.find((block) => block.type === "Footer") || null;
      let nextHeader =
        fromThemeBlock(site.theme?.globalHeader) ||
        fromThemeBlock(site.theme?.header) ||
        legacyHeader ||
        createGlobalHeader(site);
      let nextFooter =
        fromThemeBlock(site.theme?.globalFooter) ||
        fromThemeBlock(site.theme?.footer) ||
        legacyFooter ||
        createGlobalFooter(site);
      const conversionPage =
        nextPages.find((candidate) =>
          /book|appointment|contact|enquir/i.test(
            `${candidate.name} ${candidate.slug}`,
          ),
        ) || null;
      if (!nextHeader.links?.length) {
        nextHeader = {
          ...nextHeader,
          links: nextPages.map((candidate) => ({
            id: crypto.randomUUID(),
            label: candidate.name,
            url: candidate.slug,
          })),
        };
      }
      if (
        conversionPage &&
        (!nextHeader.btnActionType || nextHeader.btnActionType === "booking")
      ) {
        nextHeader = {
          ...nextHeader,
          btnActionType: "link",
          btnActionValue: conversionPage.slug,
        };
      }
      if (
        conversionPage &&
        (!nextFooter.btnActionType || nextFooter.btnActionType === "booking")
      ) {
        nextFooter = {
          ...nextFooter,
          btnActionType: "link",
          btnActionValue: conversionPage.slug,
        };
      }
      const nextBlocks = loadedBlocks.filter(
        (block) => block.type !== "Navigation" && block.type !== "Footer",
      );
      setGlobalHeader(nextHeader);
      setGlobalFooter(nextFooter);
      resetBlocks(nextBlocks);
      setSelectedId(nextBlocks[0]?.id || nextHeader.id);
      setLoaded(true);
      window.setTimeout(() => {
        suppressPageAutosaveRef.current = false;
      }, 0);
    };
    load();
  }, [site.id, resetBlocks]);

  const persistPageBlocks = async (
    pageId: string,
    nextBlocks: WebBlock[],
  ) => {
    const localBlocks = nextBlocks.filter(
      (block) => block.type !== "Navigation" && block.type !== "Footer",
    );
    const { error: deleteError } = await supabase
      .from("blocks")
      .delete()
      .eq("page_id", pageId);
    if (deleteError) throw deleteError;
    if (localBlocks.length) {
      const { error: insertError } = await supabase.from("blocks").insert(
        localBlocks.map((block, position) => ({
          id: block.id,
          page_id: pageId,
          type: block.type,
          position,
          config: { ...block, id: undefined },
        })),
      );
      if (insertError) throw insertError;
    }
  };

  useEffect(() => {
    if (!loaded || !activePageId || suppressPageAutosaveRef.current) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        await persistPageBlocks(activePageId, blocks);
      } catch (error: any) {
        notify(`Could not save this page: ${error?.message || "Unknown error"}`, "error");
      } finally {
        setSaving(false);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [blocks, activePageId, loaded]);

  useEffect(() => {
    if (!loaded || !globalHeader || !globalFooter) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      const nextTheme = {
        ...(site.theme || {}),
        globalHeader,
        globalFooter,
        // Keep legacy aliases during the transition so older production
        // renderers and cached deployments display the exact same chrome.
        header: globalHeader,
        footer: globalFooter,
      };
      try {
        const { error } = await supabase
          .from("sites")
          .update({ theme: nextTheme })
          .eq("id", site.id);
        if (error) throw error;
        onUpdateSite?.({ ...site, theme: nextTheme });
      } catch (error: any) {
        notify(`Could not save the global header/footer: ${error?.message || "Unknown error"}`, "error");
      } finally {
        setSaving(false);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [globalHeader, globalFooter, loaded]);

  const switchPage = async (pageId: string) => {
    if (pageId === activePageId || !pageId || pageSwitchingRef.current) return;
    pageSwitchingRef.current = true;
    setSaving(true);
    try {
      if (activePageId) {
        await persistPageBlocks(activePageId, blocks);
      }
      const { data: blockRows, error: blocksError } = await supabase
        .from("blocks")
        .select("*")
        .eq("page_id", pageId)
        .order("position");
      if (blocksError) throw blocksError;
      const nextBlocks = (blockRows || [])
        .map(fromRow)
        .filter(
          (block) => block.type !== "Navigation" && block.type !== "Footer",
        );
      suppressPageAutosaveRef.current = true;
      setActivePageId(pageId);
      resetBlocks(nextBlocks);
      setSelectedId(nextBlocks[0]?.id || globalHeader?.id || null);
      setSelectedSubElement(null);
      window.setTimeout(() => {
        suppressPageAutosaveRef.current = false;
      }, 0);
    } catch (error: any) {
      notify(`Could not switch pages: ${error?.message || "Unknown error"}`, "error");
    } finally {
      pageSwitchingRef.current = false;
      setSaving(false);
    }
  };

  const navigateToPage = (slug: string) => {
    const target = pages.find(
      (page) => page.slug === slug.replace(/^\//, "") || page.id === slug,
    );
    if (target) {
      switchPage(target.id);
      setPreviewOpen(false);
    }
  };

  useEffect(() => {
    const openCommand = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      const target = event.target as HTMLElement | null;
      const editingText =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (!editingText && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (
        !editingText &&
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "y"
      ) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", openCommand);
    return () => window.removeEventListener("keydown", openCommand);
  }, [redo, undo]);

  const updateSelected = (patch: Partial<WebBlock>) => {
    if (!selected) return;
    if (selected.id === globalHeader?.id) {
      setGlobalHeader((current) =>
        current ? ({ ...current, ...patch } as WebBlock) : current,
      );
      return;
    }
    if (selected.id === globalFooter?.id) {
      setGlobalFooter((current) =>
        current ? ({ ...current, ...patch } as WebBlock) : current,
      );
      return;
    }
    setBlocks((current) =>
      current.map((block) =>
        block.id === selected.id ? { ...block, ...patch } : block,
      ),
    );
  };
  const updateStyle = (patch: Partial<BlockCSSStyles>) =>
    updateSelected({
      styles: { ...selected?.styles, ...patch } as BlockCSSStyles,
    });
  // Selection helpers — clicking a component on the canvas or in the DOM tree
  // surfaces its Content tab automatically so it can be edited right away.
  const handleSelectBlock = (blockId: string) => {
    if (blockId !== selectedId || selectedSubElement !== null) {
      setActiveTab("content");
    }
    setSelectedId(blockId);
    setSelectedSubElement(null);
  };
  const handleSelectSubElement = (subElementId: string) => {
    setSelectedSubElement(subElementId);
    setActiveTab("content");
  };
  const addBlock = (
    type: string,
    variant = BLOCK_VARIANTS_MAP[type]?.[0]?.id || "minimal",
  ) => {
    const block = createBlock(type, variant);
    setBlocks((current) => [...current, block]);
    setSelectedId(block.id);
    setCommandOpen(false);
  };
  const duplicate = () => {
    if (!selected || isGlobalSelected) return;
    const next = { ...structuredClone(selected), id: crypto.randomUUID() };
    setBlocks((current) => {
      const at = current.findIndex((block) => block.id === selected.id);
      return [...current.slice(0, at + 1), next, ...current.slice(at + 1)];
    });
    setSelectedId(next.id);
  };
  const remove = () => {
    if (!selected || isGlobalSelected) return;
    setBlocks((current) => current.filter((block) => block.id !== selected.id));
    setSelectedId(blocks.find((block) => block.id !== selected.id)?.id || null);
  };
  const moveBlock = (blockId: string, direction: -1 | 1) => {
    setBlocks((current) => {
      const index = current.findIndex((item) => item.id === blockId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "page";

  const createPage = async () => {
    const name = newPageName.trim();
    if (!name) return;
    const slug = slugify(name);
    if (pages.some((candidate) => candidate.slug === slug)) {
      notify("A page with that URL already exists.", "error");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("pages")
        .insert({
          site_id: site.id,
          name,
          slug,
          seo_title: `${name} | ${site.business_name}`,
          seo_desc: `Learn more about ${name.toLowerCase()} at ${site.business_name}.`,
          position: pages.length,
        })
        .select("id, name, slug, seo_title, seo_desc, position")
        .single();
      if (error) throw error;
      const nextPage = data as Page;
      setPages((current) => [...current, nextPage]);
      setNewPageName("");
      setPageManagerOpen(false);
      setActivePageId(nextPage.id);
      resetBlocks([]);
      setSelectedId(globalHeader?.id || null);
      notify(`${name} page created.`);
    } catch (error: any) {
      notify(`Could not create the page: ${error?.message || "Unknown error"}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const updatePage = async (pageId: string, patch: Partial<Page>) => {
    const nextPatch = { ...patch };
    if (typeof nextPatch.slug === "string") nextPatch.slug = slugify(nextPatch.slug);
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("pages")
        .update(nextPatch)
        .eq("id", pageId)
        .select("id, name, slug, seo_title, seo_desc, position")
        .single();
      if (error) throw error;
      setPages((current) =>
        current.map((candidate) => (candidate.id === pageId ? (data as Page) : candidate)),
      );
      notify("Page settings saved.");
    } catch (error: any) {
      notify(`Could not update the page: ${error?.message || "Unknown error"}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (pageToDelete: Page) => {
    if (pages.length <= 1 || pageToDelete.slug === "home") {
      notify("The Home page cannot be deleted.", "error");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("pages").delete().eq("id", pageToDelete.id);
      if (error) throw error;
      const nextPages = pages.filter((candidate) => candidate.id !== pageToDelete.id);
      setPages(nextPages);
      if (activePageId === pageToDelete.id) {
        const nextPage = nextPages[0];
        const { data: rows, error: blockError } = await supabase
          .from("blocks")
          .select("*")
          .eq("page_id", nextPage.id)
          .order("position");
        if (blockError) throw blockError;
        const nextBlocks = (rows || [])
          .map(fromRow)
          .filter((item) => item.type !== "Navigation" && item.type !== "Footer");
        setActivePageId(nextPage.id);
        resetBlocks(nextBlocks);
        setSelectedId(nextBlocks[0]?.id || globalHeader?.id || null);
      }
      notify(`${pageToDelete.name} page deleted.`, "info");
    } catch (error: any) {
      notify(`Could not delete the page: ${error?.message || "Unknown error"}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const applySiteKit = async (kitId: string) => {
    const kit = getSiteKit(kitId);
    if (!kit) return;
    setApplyingKitId(kitId);
    setSaving(true);
    try {
      const materialized = kit.build(site.business_name);
      const { data: existingBlockRows } = await supabase
        .from("blocks")
        .select("*, pages!inner(site_id)")
        .eq("pages.site_id", site.id);
      await supabase.from("site_history").insert({
        site_id: site.id,
        page_id: null,
        blocks: existingBlockRows || [],
        header: globalHeader,
        footer: globalFooter,
        seo_title: `Before applying ${kit.name}`,
        seo_desc: "Automatic backup created by the site-kit installer.",
      });

      const nextPages: Page[] = [];
      for (let position = 0; position < materialized.pages.length; position += 1) {
        const kitPage = materialized.pages[position];
        const existing = pages.find((candidate) => candidate.slug === kitPage.slug);
        const payload = {
          site_id: site.id,
          name: kitPage.name,
          slug: kitPage.slug,
          seo_title: kitPage.seoTitle,
          seo_desc: kitPage.seoDesc,
          position,
        };
        const query = existing
          ? supabase
              .from("pages")
              .update(payload)
              .eq("id", existing.id)
              .select("id, name, slug, seo_title, seo_desc, position")
              .single()
          : supabase
              .from("pages")
              .insert(payload)
              .select("id, name, slug, seo_title, seo_desc, position")
              .single();
        const { data: savedPage, error: pageError } = await query;
        if (pageError || !savedPage) throw pageError || new Error("Page creation failed");
        await persistPageBlocks(savedPage.id, kitPage.blocks);
        nextPages.push(savedPage as Page);
      }

      const retainedIds = new Set(nextPages.map((item) => item.id));
      const obsoleteIds = pages
        .filter((candidate) => !retainedIds.has(candidate.id))
        .map((candidate) => candidate.id);
      if (obsoleteIds.length) {
        const { error: deleteError } = await supabase
          .from("pages")
          .delete()
          .in("id", obsoleteIds);
        if (deleteError) throw deleteError;
      }

      const nextTheme = {
        ...(site.theme || {}),
        globalHeader: materialized.header,
        globalFooter: materialized.footer,
        header: materialized.header,
        footer: materialized.footer,
        activeSiteKit: kit.id,
      };
      const { data: updatedSite, error: siteError } = await supabase
        .from("sites")
        .update({ theme: nextTheme })
        .eq("id", site.id)
        .select()
        .single();
      if (siteError) throw siteError;

      if (materialized.products?.length) {
        const { error: productDeleteError } = await supabase
          .from("ecom_products")
          .delete()
          .eq("site_id", site.id);
        if (productDeleteError) throw productDeleteError;
        const { error: productInsertError } = await supabase
          .from("ecom_products")
          .insert(
            materialized.products.map((product) => ({
              site_id: site.id,
              title: product.title,
              description: product.description,
              price: product.price,
              compare_at_price: product.compareAtPrice || null,
              images: [{ url: product.image, alt: product.title }],
              stock: 50,
              category: product.category,
              tags: product.tags,
              offer_badge: product.badge || null,
              status: "active",
              seo_title: `${product.title} | ${site.business_name}`,
              seo_desc: product.description,
            })),
          );
        if (productInsertError) throw productInsertError;
      }

      const firstPage = nextPages[0];
      setPages(nextPages);
      setActivePageId(firstPage.id);
      resetBlocks(materialized.pages[0].blocks);
      setGlobalHeader(materialized.header);
      setGlobalFooter(materialized.footer);
      setSelectedId(materialized.pages[0].blocks[0]?.id || materialized.header.id);
      setSiteKitsOpen(false);
      onUpdateSite?.((updatedSite as SiteRecord) || { ...site, theme: nextTheme });
      const products = await fetchProducts(site.id);
      setEcomProducts(
        products.map((product: any) => ({
          id: product.id,
          title: product.title,
          description: product.description,
          price: String(product.price),
          compare_at: product.compare_at_price ? String(product.compare_at_price) : "",
          stock: product.stock,
          category: product.category || "General",
          tags: product.tags || [],
          offer_badge: product.offer_badge || "",
          status: product.status === "active" ? "Active" : "Draft",
          image: product.images?.[0]?.url || "",
        })),
      );
      notify(`${kit.name} installed across ${nextPages.length} pages.`);
    } catch (error: any) {
      notify(`Could not apply the site kit: ${error?.message || "Unknown error"}`, "error");
    } finally {
      setApplyingKitId(null);
      setSaving(false);
    }
  };
  const replaceVariant = (variant: string) => {
    if (!selected) return;
    const previousPatch = variantStylePatches[selected?.variant || ""] || {};
    const preservedStyles = Object.fromEntries(
      Object.entries(selected?.styles || {}).filter(
        ([key]) => !(key in previousPatch),
      ),
    ) as Partial<BlockCSSStyles>;
    updateSelected(ensureStructuredContent({
      ...selected,
      variant,
      styles: {
        ...preservedStyles,
        ...(variantStylePatches[variant] || {}),
      } as BlockCSSStyles,
    }));
  };
  const maxWidth =
    viewport === "mobile" ? "390px" : viewport === "tablet" ? "760px" : "100%";
  // Type-aware content fields: only surface fields the selected block type
  // actually renders (verified against builder-renderer per type). Premium and
  // Academy variants render through their own modules that consume every common
  // field, so they always keep the full set.
  const premiumModuleVariant = Boolean(
    selected &&
      (isPremiumAcademyVariant(selected.variant) ||
        isPremiumSiteModuleVariant(selected.variant)),
  );
  const showHeading =
    Boolean(selected) &&
    ((selected.type !== "Navigation" && selected.type !== "Footer") ||
      premiumModuleVariant);
  const showButtonLabel =
    Boolean(selected) &&
    (selected.btnText !== undefined ||
      premiumModuleVariant ||
      [
        "Hero",
        "Features",
        "Business",
        "Pricing",
        "CTA",
        "Forms",
        "Contact",
        "Navigation",
      ].includes(selected.type));
  const showImageUrl =
    Boolean(selected) &&
    (["Hero", "Navigation", "Footer"].includes(selected.type) ||
      premiumModuleVariant);
  const showBadge =
    Boolean(selected) &&
    (!["Navigation", "Footer", "Map"].includes(selected.type) ||
      premiumModuleVariant);

  const applySiteDNA = (dna: SiteDNA) => {
    setBlocks(applyDNAToBlocks(blocks, dna));
    if (globalHeader) setGlobalHeader(applyDNAToBlocks([globalHeader], dna)[0]);
    if (globalFooter) setGlobalFooter(applyDNAToBlocks([globalFooter], dna)[0]);
    setCommandOpen(false);
    notify(`Applied the “${dna.name}” design system to the whole page.`, "success");
  };

  const commands = useMemo(
    () => [
      ...SITE_DNA_PRESETS.map((dna) => ({
        label: `Restyle site — ${dna.name}`,
        keywords: `style dna brand theme restyle ${dna.id} ${dna.keywords.join(" ")}`,
        hint: dna.description,
        action: () => applySiteDNA(dna),
      })),
      ...BLOCK_CATEGORIES.filter(
        (category) => category.id !== "Navigation" && category.id !== "Footer",
      ).map((category) => ({
        label: `Add ${category.name}`,
        keywords: `${category.id} ${category.description}`,
        action: () => addBlock(category.id),
      })),
      {
        label: "Open page settings",
        keywords: "seo domain page",
        action: () => {},
      },
      {
        label: "Preview website",
        keywords: "view live preview",
        action: () => setPreviewOpen(true),
      },
    ],
    [blocks, globalHeader, globalFooter],
  );

  return (
    <div className="editor-surface h-screen overflow-hidden bg-[#f3f5f4] text-[#1c2521]">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            onClick={onExit}
            className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-slate-500 hover:bg-slate-100"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={17} />
          </button>
          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.03em]">
              {site.business_name}
            </p>
            <p className="hidden text-xs font-semibold text-slate-600 sm:block">
              Visual Builder
            </p>
          </div>
          <span className="hidden rounded-md bg-lime-100 px-2 py-1 text-xs font-semibold text-lime-800 md:block">
            {saving ? "SAVING" : "SAVED"}
          </span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo"
              className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Undo (Ctrl/Cmd + Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo"
              className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Redo (Ctrl/Cmd + Shift + Z)"
            >
              <Redo2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(
              [
                { id: "desktop", icon: Monitor },
                { id: "tablet", icon: Tablet },
                { id: "mobile", icon: Smartphone },
              ] as const
            ).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewport(id)}
                aria-label={`Switch to ${id} preview`}
                className={`editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] ${viewport === id ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-700"}`}
                title={`${id[0].toUpperCase()}${id.slice(1)} preview`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="More editor controls"
                className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
              >
                <MoreHorizontal size={17} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="end"
                sideOffset={8}
                className="editor-surface z-[90] w-64 rounded-[var(--radius-panel)] border border-slate-200 bg-white p-2 shadow-xl"
              >
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    aria-label="Undo"
                    className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    aria-label="Redo"
                    className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Redo2 size={14} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: "desktop", icon: Monitor },
                      { id: "tablet", icon: Tablet },
                      { id: "mobile", icon: Smartphone },
                    ] as const
                  ).map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setViewport(id)}
                      aria-label={`Switch to ${id} preview`}
                      className={`editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] ${
                        viewport === id
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setSiteKitsOpen(true)}
                    className="editor-interactive flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <LayoutTemplate size={13} /> Site kits
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommandOpen(true)}
                    className="editor-interactive flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <button
            onClick={() => setSiteKitsOpen(true)}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-lime-500 hover:text-lime-800 sm:flex"
          >
            <LayoutTemplate size={14} /> Site kits
          </button>
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 sm:flex"
          >
            <CommandIcon size={14} /> Add{" "}
            <kbd className="rounded border border-slate-200 px-1 text-xs text-slate-600">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => setPreviewOpen(true)}
            className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Preview"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              if (activePageId) {
                await persistPageBlocks(activePageId, blocks);
              }
               const nextTheme = {
                 ...(site.theme || {}),
                 globalHeader,
                 globalFooter,
                 header: globalHeader,
                 footer: globalFooter,
               };
               const { data, error } = await supabase
                 .from("sites")
                .update({ published: true, theme: nextTheme })
                .eq("id", site.id)
                .select()
                 .single();
               if (error) {
                 notify(`Publish failed: ${error.message}`, "error");
                 setSaving(false);
                 return;
               }
              onUpdateSite?.(
                (data as SiteRecord) || {
                  ...site,
                  published: true,
                  theme: nextTheme,
                },
               );
               setSaving(false);
               notify("Website published with the latest header, footer, and page content.");
             }}
            className="rounded-lg bg-[#1c2521] px-3 py-2 text-xs font-semibold text-white hover:bg-[#354139]"
          >
            Publish
          </button>
        </div>
      </header>

      <div className="xl:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-4 text-center shadow-[0_-8px_24px_rgba(28,37,33,0.08)]">
        <p className="text-sm font-semibold text-slate-700">
          The editor needs a wider screen
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Open OnlyPage on a display 1280px or wider to edit sections.
        </p>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="relative hidden w-[270px] shrink-0 overflow-hidden border-r border-slate-200 bg-white text-slate-900 lg:block flex flex-col">
          <div className="border-b border-slate-200 p-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">
                Active Page
              </p>
              <button
                type="button"
                onClick={() => setPageManagerOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-lime-600 hover:text-lime-700 transition cursor-pointer"
              >
                <Pencil size={11} /> Manage
              </button>
            </div>
            <div className="relative mt-2">
              <select
                value={activePageId || ""}
                onChange={(event) => switchPage(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-left text-xs font-medium text-slate-700 outline-none transition focus:border-lime-500 cursor-pointer"
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.id} className="bg-white text-slate-700">
                    {page.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 bg-white scrollbar-thin">
            <BuilderTreeNavigator
              blocks={pageBlocks}
              selectedBlockId={selectedId}
              selectedSubElement={selectedSubElement}
              onSelectBlock={(id) => handleSelectBlock(id)}
              onSelectSubElement={(subId) => handleSelectSubElement(subId)}
              onMoveBlock={(idx, dir) => {
                const b = pageBlocks[idx];
                if (b) moveBlock(b.id, dir === 'up' ? -1 : 1);
              }}
              onDuplicateBlock={(id) => {
                setSelectedId(id);
                duplicate();
              }}
              onDeleteBlock={(id) => {
                setSelectedId(id);
                remove();
              }}
              onOpenAddSectionModal={() => setCommandOpen(true)}
              globalHeader={globalHeader}
              globalFooter={globalFooter}
            />
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col overflow-auto bg-[radial-gradient(#cbd5d0_1px,transparent_1px)] [background-size:18px_18px]">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-[#f3f5f4]/80 px-4 py-3 backdrop-blur">
            <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-500 shadow-sm">
              {viewport === "desktop"
                ? "Responsive desktop"
                : `${viewport === "tablet" ? "760" : "390"}px preview`}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Click any section to edit
            </span>
          </div>
          <div className="mx-auto w-full px-4 pb-20" style={{ maxWidth }}>
            <div
              className={`@container overflow-hidden shadow-[0_20px_60px_rgba(28,37,33,0.12)] ${viewport === "mobile" ? "rounded-[28px] border-[8px] border-slate-950" : "rounded-xl border border-slate-200"}`}
            >
              {globalHeader && (
                <motion.div
                  key={globalHeader.id}
                  id={globalHeader.id}
                  data-block-type="Navigation"
                  layout
                  onClick={() => handleSelectBlock(globalHeader.id)}
                  className={`group relative cursor-pointer transition ${selectedId === globalHeader.id ? "z-[1] ring-2 ring-inset ring-lime-500" : "hover:ring-2 hover:ring-inset hover:ring-lime-300/70"}`}
                >
                  {selectedId !== globalHeader.id && (
                    <button
                      type="button"
                      aria-label="Edit global header"
                      data-editor-selection-overlay="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectBlock(globalHeader.id);
                      }}
                      className="absolute inset-0 z-40 cursor-pointer bg-transparent"
                    />
                  )}
                  <BuilderRenderer
                    block={globalHeader}
                    isActive={selectedId === globalHeader.id}
                    onSelect={() => handleSelectBlock(globalHeader.id)}
                    selectedSubElement={selectedId === globalHeader.id ? selectedSubElement : null}
                    onSelectSubElement={(subId) => {
                      handleSelectBlock(globalHeader.id);
                      handleSelectSubElement(subId);
                    }}
                    site={site}
                    siteId={site.id}
                    pages={pages}
                    activePageId={activePageId}
                    onNavigatePage={navigateToPage}
                    ecomProducts={activeProducts}
                  />
                  <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-[#1c2521] px-2 py-1 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100">
                    Global header · every page
                  </div>
                </motion.div>
              )}
              {pageBlocks.length === 0 ? (
                <div className="grid min-h-[480px] place-items-center p-8 text-center">
                  <div>
                    <LayoutPanelTop
                      className="mx-auto text-slate-500"
                      size={32}
                    />
                    <h2 className="mt-4 text-lg font-semibold">
                      Start with a useful section
                    </h2>
                    <p className="mt-2 max-w-xs text-sm text-slate-500">
                      Add a hero, booking form, services, or pricing from the
                      command menu.
                    </p>
                    <button
                      onClick={() => setCommandOpen(true)}
                      className="mt-5 rounded-lg bg-[#1c2521] px-4 py-2.5 text-xs font-semibold text-white"
                    >
                      Add your first section
                    </button>
                  </div>
                </div>
              ) : (
                pageBlocks.map((block) => (
                  <motion.div
                    key={block.id}
                    id={block.id}
                    data-block-type={block.type}
                    layout
                    onClick={() => handleSelectBlock(block.id)}
                    className={`group relative cursor-pointer transition ${selectedId === block.id ? "z-[1] ring-2 ring-inset ring-lime-500" : "hover:ring-2 hover:ring-inset hover:ring-lime-300/70"}`}
                  >
                    {selectedId !== block.id && (
                      <button
                        type="button"
                        aria-label={`Edit ${block.type} section`}
                        data-editor-selection-overlay="true"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSelectBlock(block.id);
                        }}
                        className="absolute inset-0 z-40 cursor-pointer bg-transparent"
                      />
                    )}
                    <BuilderRenderer
                      block={block}
                      isActive={selectedId === block.id}
                      onSelect={() => handleSelectBlock(block.id)}
                      selectedSubElement={selectedId === block.id ? selectedSubElement : null}
                      onSelectSubElement={(subId) => {
                        handleSelectBlock(block.id);
                        handleSelectSubElement(subId);
                      }}
                      site={site}
                      siteId={site.id}
                      pages={pages}
                      activePageId={activePageId}
                      onNavigatePage={navigateToPage}
                      ecomProducts={activeProducts}
                    />
                    <div
                      className={`pointer-events-none absolute left-3 top-3 rounded-md bg-[#1c2521] px-2 py-1 text-xs font-semibold text-white shadow transition ${selectedId === block.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      {block.type}
                    </div>
                  </motion.div>
                ))
              )}
              {globalFooter && (
                <motion.div
                  key={globalFooter.id}
                  id={globalFooter.id}
                  data-block-type="Footer"
                  layout
                  onClick={() => handleSelectBlock(globalFooter.id)}
                  className={`group relative cursor-pointer transition ${selectedId === globalFooter.id ? "z-[1] ring-2 ring-inset ring-lime-500" : "hover:ring-2 hover:ring-inset hover:ring-lime-300/70"}`}
                >
                  {selectedId !== globalFooter.id && (
                    <button
                      type="button"
                      aria-label="Edit global footer"
                      data-editor-selection-overlay="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectBlock(globalFooter.id);
                      }}
                      className="absolute inset-0 z-40 cursor-pointer bg-transparent"
                    />
                  )}
                  <BuilderRenderer
                    block={globalFooter}
                    isActive={selectedId === globalFooter.id}
                    onSelect={() => handleSelectBlock(globalFooter.id)}
                    selectedSubElement={selectedId === globalFooter.id ? selectedSubElement : null}
                    onSelectSubElement={(subId) => {
                      handleSelectBlock(globalFooter.id);
                      handleSelectSubElement(subId);
                    }}
                    site={site}
                    siteId={site.id}
                    pages={pages}
                    activePageId={activePageId}
                    onNavigatePage={navigateToPage}
                    ecomProducts={activeProducts}
                  />
                  <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-[#1c2521] px-2 py-1 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100">
                    Global footer · every page
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden w-[360px] shrink-0 border-l border-slate-200 bg-white xl:block">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <div>
                  <p className="text-xs font-medium text-slate-600">
                    Editing section
                  </p>
                  <p className="mt-1 text-sm font-semibold">{selected.type}</p>
                </div>
                {isGlobalSelected ? (
                  <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500">
                    <LockKeyhole size={12} /> Every page
                  </span>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const i = pageBlocks.findIndex(
                          (b) => b.id === selected.id,
                        );
                        if (i > 0) moveBlock(selected.id, -1);
                      }}
                      className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-slate-500 hover:bg-slate-100"
                      aria-label="Move section up"
                      title="Move up"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      onClick={() => {
                        const i = pageBlocks.findIndex(
                          (b) => b.id === selected.id,
                        );
                        if (i >= 0 && i < pageBlocks.length - 1)
                          moveBlock(selected.id, 1);
                      }}
                      className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-slate-500 hover:bg-slate-100"
                      aria-label="Move section down"
                      title="Move down"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      onClick={duplicate}
                      className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-slate-500 hover:bg-slate-100"
                      aria-label="Duplicate section"
                      title="Duplicate"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={remove}
                      className="editor-interactive grid size-10 place-items-center rounded-[var(--radius-control)] text-rose-500 hover:bg-rose-50"
                      aria-label="Delete section"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <Tabs.Root
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "content" | "design" | "effects")
                }
                className="flex min-h-0 flex-1 flex-col"
              >
                <Tabs.List className="grid grid-cols-3 border-b border-slate-100 px-3 pt-2">
                  <Tabs.Trigger
                    value="content"
                    className="border-b-2 border-transparent px-2 py-2.5 text-xs font-semibold text-slate-600 data-[state=active]:border-lime-600 data-[state=active]:text-slate-900"
                  >
                    Content
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="design"
                    className="border-b-2 border-transparent px-2 py-2.5 text-xs font-semibold text-slate-600 data-[state=active]:border-lime-600 data-[state=active]:text-slate-900"
                  >
                    Style
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="effects"
                    className="border-b-2 border-transparent px-2 py-2.5 text-xs font-semibold text-slate-600 data-[state=active]:border-lime-600 data-[state=active]:text-slate-900"
                  >
                    Effects
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content
                  value="content"
                  className="min-h-0 flex-1 overflow-y-auto p-4"
                >
                  {showBadge && (
                  <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5 select-none">
                        <Tag size={12} className="text-lime-600" />
                        <span>Badge / Eyebrow</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const isBadgeActive = selected.showBadge !== false && Boolean(selected.badge);
                          if (isBadgeActive) {
                            updateSelected({ showBadge: false });
                          } else {
                            const updates: Record<string, any> = { showBadge: true };
                            if (!selected.badge) {
                              updates.badge = "WELCOME BADGE";
                            }
                            updateSelected(updates);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                          selected.showBadge !== false && Boolean(selected.badge)
                            ? "bg-lime-500/15 text-lime-700 border border-lime-500/30 hover:bg-lime-500/25"
                            : "bg-slate-200/80 text-slate-500 border border-slate-300 hover:bg-slate-200"
                        }`}
                        title={selected.showBadge !== false && Boolean(selected.badge) ? "Click to turn off badge" : "Click to turn on badge"}
                      >
                        <span className={`size-1.5 rounded-full ${
                          selected.showBadge !== false && Boolean(selected.badge)
                            ? "bg-lime-600 animate-pulse"
                            : "bg-slate-400"
                        }`} />
                        <span>{selected.showBadge !== false && Boolean(selected.badge) ? "Badge On" : "Badge Off"}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={selected.badge || ""}
                        placeholder="e.g. AMBIENT LUXURY WELLNESS"
                        onChange={(event) => {
                          const val = event.target.value;
                          updateSelected({
                            badge: val,
                            ...(val && selected.showBadge === false ? { showBadge: true } : {})
                          });
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none transition ${
                          selected.showBadge === false
                            ? "border-slate-200 bg-slate-100/70 text-slate-600 opacity-70"
                            : "border-slate-200 bg-white text-slate-900 focus:border-lime-600 focus:ring-1 focus:ring-lime-600"
                        }`}
                      />
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-slate-600 leading-tight">
                      {selected.showBadge === false
                        ? "Badge is turned off and hidden from section header."
                        : "Badge pill displayed above the section title."}
                    </p>
                  </div>
                  )}
                  {showHeading && (
                  <>
                  <Field
                    label="Heading"
                    value={selected.title || ""}
                    onChange={(value) => updateSelected({ title: value })}
                    multiline
                  />
                  <Field
                    label="Supporting copy"
                    value={selected.subtitle || ""}
                    onChange={(value) => updateSelected({ subtitle: value })}
                    multiline
                  />
                  </>
                  )}
                  {showButtonLabel && (
                  <>
                  <Field
                    label="Button label"
                    value={selected.btnText || ""}
                    onChange={(value) => updateSelected({ btnText: value })}
                  />
                    <ActionPanel
                      block={selected}
                      pages={pages}
                      sections={pageBlocks}
                      site={site}
                      onChange={updateSelected}
                    />
                  </>
                  )}
                  {(["Hero", "Navigation"].includes(selected.type) ||
                    selected.secondaryBtnText !== undefined) && (
                    <>
                      <Field
                        label="Secondary button label"
                        value={selected.secondaryBtnText || ""}
                        onChange={(value) =>
                          updateSelected({ secondaryBtnText: value })
                        }
                      />
                      {selected.secondaryBtnText && (
                        <ActionPanel
                          title="Secondary button destination"
                          block={{
                            ...selected,
                            btnActionType:
                              selected.secondaryBtnActionType || "none",
                            btnActionValue:
                              selected.secondaryBtnActionValue || "",
                          }}
                          pages={pages}
                          sections={pageBlocks}
                          site={site}
                          onChange={(patch) =>
                            updateSelected({
                              ...(patch.btnActionType !== undefined
                                ? {
                                    secondaryBtnActionType:
                                      patch.btnActionType,
                                  }
                                : {}),
                              ...(patch.btnActionValue !== undefined
                                ? {
                                    secondaryBtnActionValue:
                                      patch.btnActionValue,
                                  }
                                : {}),
                            })
                          }
                        />
                      )}
                    </>
                  )}
                  {(selected.type === "Forms" ||
                    selected.type === "Contact") && (
                    <LeadRoutingPanel
                      block={selected}
                      onChange={updateSelected}
                    />
                  )}
                  {showImageUrl && (
                    <Field
                      label={
                        selected.type === "Navigation"
                          ? "Logo image URL"
                          : "Primary image URL"
                      }
                      value={selected.imageUrl || ""}
                      onChange={(value) => updateSelected({ imageUrl: value })}
                    />
                  )}
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-medium text-slate-600">
                      Layout variant
                    </p>
                    <VariantPicker
                      type={selected.type}
                      value={selected.variant || ""}
                      onChange={replaceVariant}
                    />
                  </div>
                  <BuilderDataConnections
                    block={selected}
                    site={site}
                    products={ecomProducts}
                    productsLoading={productsLoading}
                    onChange={updateSelected}
                    onNavigateModule={onNavigateModule}
                  />
                  <BlockContentEditor
                    block={selected}
                    selectedSubElement={selectedSubElement}
                    onChange={updateSelected}
                  />
                </Tabs.Content>
                <Tabs.Content
                  value="design"
                  className="min-h-0 flex-1 overflow-y-auto bg-white p-3 scrollbar-thin"
                >
                  <BuilderStyleInspector
                    block={selected}
                    selectedSubElement={selectedSubElement}
                    onUpdateStyles={(updatedStyles) => updateStyle(updatedStyles)}
                    onUpdateSubElementStyles={(_subId, subStyles) => updateStyle(subStyles)}
                  />
                </Tabs.Content>
                <Tabs.Content
                  value="effects"
                  className="min-h-0 flex-1 overflow-y-auto p-4"
                >
                  <p className="text-xs leading-5 text-slate-500">
                    Use interaction sparingly: it should make an action clearer,
                    not compete with your customer’s decision.
                  </p>
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-medium text-slate-600">
                      Hover interaction
                    </p>
                    <select
                      value={selected.styles.hoverEffect || "none"}
                      onChange={(event) =>
                        updateStyle({ hoverEffect: event.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none"
                    >
                      <option value="none">None</option>
                      <option value="lift">Lift</option>
                      <option value="glow">Soft glow</option>
                      <option value="scale">Gentle scale</option>
                      <option value="tilt">Pointer tilt</option>
                    </select>
                  </div>
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-medium text-slate-600">
                      On-click feedback
                    </p>
                    <select
                      value={selected.styles.clickResponse || "none"}
                      onChange={(event) =>
                        updateStyle({ clickResponse: event.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none"
                    >
                      <option value="none">None</option>
                      <option value="scale-down">Press</option>
                      <option value="bounce">Bounce</option>
                      <option value="pulse">Pulse</option>
                    </select>
                  </div>
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button className="mt-5 flex w-full items-center justify-between rounded-lg bg-lime-100 px-3 py-3 text-left text-xs font-semibold text-lime-950">
                        <span className="flex items-center gap-2">
                          <WandSparkles size={14} /> Interaction guidance
                        </span>
                        <MoreHorizontal size={14} />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        side="top"
                        sideOffset={8}
                        className="z-[90] w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
                      >
                        <p className="text-xs font-semibold">
                          Use an effect only when it helps.
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Lift works well for service cards. Keep booking and
                          payment actions calm so they feel trustworthy.
                        </p>
                        <Popover.Arrow className="fill-white" />
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </Tabs.Content>
              </Tabs.Root>
            </div>
          ) : (
            <div className="grid h-full place-items-center p-8 text-center">
              <MousePointer2 className="text-slate-500" />
              <p className="mt-3 text-sm font-semibold">Select a section</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Its real content, styling and interactions will appear here.
              </p>
            </div>
          )}
        </aside>
      </div>

      <Command.Dialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        label="Add or change a website section"
        className="fixed inset-0 z-[100] bg-slate-950/45 p-4 pt-[12vh] backdrop-blur-sm"
      >
        <Command className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4">
            <CommandIcon size={17} className="text-lime-700" />
            <Command.Input
              autoFocus
              placeholder="Add booking, pricing, services…"
              className="h-14 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-600"
            />
          </div>
          <Command.List className="max-h-[380px] overflow-y-auto p-2">
            <Command.Empty className="p-6 text-center text-sm text-slate-600">
              No matching section.
            </Command.Empty>
            {commands.map((command) => (
              <Command.Item
                key={command.label}
                value={`${command.label} ${command.keywords}`}
                onSelect={command.action}
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 data-[selected=true]:bg-lime-100"
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {command.label}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">
                    {(command as { hint?: string }).hint ?? command.keywords}
                  </span>
                </span>
                <Plus size={15} className="text-lime-700" />
              </Command.Item>
            ))}
          </Command.List>
          <div className="border-t border-slate-100 px-4 py-3 text-xs font-medium text-slate-600">
            Add a section, then edit its actual content from the right panel.
          </div>
        </Command>
      </Command.Dialog>

      {pageManagerOpen && (
        <PageManagerModal
          pages={pages}
          activePageId={activePageId}
          newPageName={newPageName}
          saving={saving}
          onNewPageNameChange={setNewPageName}
          onCreate={createPage}
          onSelect={switchPage}
          onUpdate={updatePage}
          onDelete={deletePage}
          onClose={() => setPageManagerOpen(false)}
        />
      )}

      {siteKitsOpen && (
        <SiteKitsModal
          currentKitId={site.theme?.activeSiteKit}
          applyingKitId={applyingKitId}
          onApply={applySiteKit}
          onClose={() => setSiteKitsOpen(false)}
        />
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[95] overflow-auto bg-slate-950/75 p-4">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-3">
              <span className="text-xs font-semibold">
                Preview — {site.business_name}
              </span>
              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-md px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            {renderedBlocks.map((block) => (
              <div
                key={block.id}
                id={block.id}
                data-block-type={block.type}
              >
                <BuilderRenderer
                  block={block}
                  isActive={false}
                  onSelect={() => {}}
                  site={site}
                  siteId={site.id}
                  pages={pages}
                  activePageId={activePageId}
                  onNavigatePage={navigateToPage}
                  ecomProducts={activeProducts}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {editorNotice && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-[120] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl ${
            editorNotice.tone === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : editorNotice.tone === "info"
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {editorNotice.message}
        </div>
      )}
    </div>
  );
}
export default VisualBuilder;
